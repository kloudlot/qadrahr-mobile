import { useState } from "react";
import { Pressable, View } from "react-native";
import { AlertTriangle, Laptop, PackagePlus } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { Divider, ListCard, ListRow, Section } from "@/components/ui/List";
import { DateField } from "@/components/ui/Pickers";
import { Screen } from "@/components/ui/Screen";
import { Sheet } from "@/components/ui/Sheet";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import {
  ASSET_CATEGORIES,
  useCancelAssetRequest,
  useMyAssetRequests,
  useMyAssets,
  useReportAsset,
  useRequestAsset,
  type HeldAsset,
} from "@/lib/queries/assets";

const label = (v: string) => v.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** Company equipment I have, and what I've asked for. */
export default function MyAssetsScreen() {
  const colors = useThemeColors();
  const assets = useMyAssets();
  const requests = useMyAssetRequests();
  const cancel = useCancelAssetRequest();
  const [reporting, setReporting] = useState<HeldAsset | null>(null);
  const [requesting, setRequesting] = useState(false);

  const held = assets.data ?? [];
  const mine = requests.data ?? [];

  return (
    <Screen
      header={
        <ScreenHeader
          title="My assets"
          right={<Button label="Request" icon={PackagePlus} variant="ghost" onPress={() => setRequesting(true)} />}
        />
      }
      refreshing={assets.isRefetching}
      onRefresh={() => {
        void assets.refetch();
        void requests.refetch();
      }}
    >
      <View className="gap-5 pt-2">
        <Section title="With me now">
          {assets.isLoading ? (
            <SkeletonList rows={2} />
          ) : assets.error ? (
            <ErrorView message={errorMessage(assets.error)} onRetry={() => void assets.refetch()} />
          ) : held.length === 0 ? (
            <EmptyView icon={Laptop} title="Nothing issued to you" detail="Equipment the company gives you will be listed here." />
          ) : (
            <ListCard>
              {held.map((a, i) => (
                <View key={a._id}>
                  {i > 0 ? <Divider /> : null}
                  <ListRow
                    icon={Laptop}
                    title={a.name}
                    subtitle={`${a.tag}${a.holder ? ` · since ${formatDate(a.holder.assignedAt)}` : ""}${a.holder?.dueBackAt ? ` · due back ${formatDate(a.holder.dueBackAt)}` : ""}`}
                    right={<AlertTriangle size={18} color={colors.warning} />}
                    onPress={() => setReporting(a)}
                  />
                </View>
              ))}
            </ListCard>
          )}
          {held.length > 0 ? (
            <Text variant="caption" className="px-1 pt-2 text-text-disabled">
              Tap an item to report a problem with it.
            </Text>
          ) : null}
        </Section>

        <Section title="My requests">
          {requests.isLoading ? (
            <SkeletonList rows={2} />
          ) : mine.length === 0 ? (
            <EmptyView icon={PackagePlus} title="No requests" detail="Need a laptop or a phone? Request it — it goes to your manager." />
          ) : (
            <ListCard>
              {mine.map((r, i) => {
                const open = r.status === "pending_approval" || r.status === "approved";
                return (
                  <View key={r._id}>
                    {i > 0 ? <Divider /> : null}
                    <View className="flex-row items-center gap-3 px-4 py-3">
                      <View className="flex-1 gap-0.5">
                        <Text variant="body" className="text-text-primary">
                          {label(r.category)}
                        </Text>
                        <Text variant="small" numberOfLines={1} className="text-text-secondary">
                          {r.reason}
                        </Text>
                      </View>
                      <StatusBadge status={r.status === "pending_approval" ? "pending" : r.status} />
                      {open ? (
                        <Button
                          label="Withdraw"
                          variant="ghost"
                          loading={cancel.isPending && cancel.variables === r._id}
                          onPress={() => cancel.mutate(r._id, { onError: (e) => toast.error("Couldn't withdraw", errorMessage(e)) })}
                        />
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </ListCard>
          )}
        </Section>
      </View>

      <ReportSheet asset={reporting} onClose={() => setReporting(null)} />
      <RequestSheet visible={requesting} onClose={() => setRequesting(false)} />
    </Screen>
  );
}

function Chips<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T | null; onChange: (v: T) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => (
        <Pressable
          key={o}
          accessibilityRole="button"
          accessibilityState={{ selected: value === o }}
          onPress={() => onChange(o)}
          className={cn("rounded-full border px-3 py-1.5", value === o ? "border-brand bg-brand-subtle" : "border-border bg-bg-surface")}
        >
          <Text variant="small" className={value === o ? "font-semibold text-brand-ink" : "text-text-primary"}>
            {label(o)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const KINDS = ["fault", "damage", "loss"] as const;

function ReportSheet({ asset, onClose }: { asset: HeldAsset | null; onClose: () => void }) {
  const report = useReportAsset();
  const [kind, setKind] = useState<(typeof KINDS)[number] | null>(null);
  const [description, setDescription] = useState("");
  const ready = kind && description.trim().length >= 5;

  const close = () => {
    setKind(null);
    setDescription("");
    onClose();
  };

  return (
    <Sheet
      visible={asset !== null}
      onClose={close}
      dismissable={!report.isPending}
      title="Report a problem"
      subtitle={asset ? `${asset.name} · ${asset.tag}` : undefined}
      footer={
        <Button
          label="Send report"
          size="lg"
          block
          disabled={!ready}
          loading={report.isPending}
          onPress={() =>
            asset &&
            kind &&
            report.mutate(
              { id: asset._id, kind, description: description.trim() },
              {
                onSuccess: () => {
                  toast.success("Reported — thanks");
                  close();
                },
                onError: (e) => toast.error("Couldn't send it", errorMessage(e)),
              },
            )
          }
        />
      }
    >
      <View className="gap-4">
        <Field label="What's wrong" required>
          <Chips options={KINDS} value={kind} onChange={setKind} />
        </Field>
        <Field label="What happened" required>
          <Input value={description} onChangeText={setDescription} multiline numberOfLines={4} className="min-h-24" />
        </Field>
      </View>
    </Sheet>
  );
}

function RequestSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const request = useRequestAsset();
  const [category, setCategory] = useState<(typeof ASSET_CATEGORIES)[number] | null>(null);
  const [reason, setReason] = useState("");
  const [neededBy, setNeededBy] = useState<string | null>(null);
  const ready = category && reason.trim().length >= 5;

  const close = () => {
    setCategory(null);
    setReason("");
    setNeededBy(null);
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={close}
      dismissable={!request.isPending}
      title="Request equipment"
      subtitle="Your manager approves it, then it's arranged."
      footer={
        <Button
          label="Send request"
          size="lg"
          block
          disabled={!ready}
          loading={request.isPending}
          onPress={() =>
            category &&
            request.mutate(
              { category, reason: reason.trim(), ...(neededBy ? { neededBy } : {}) },
              {
                onSuccess: () => {
                  toast.success("Sent to your manager");
                  close();
                },
                onError: (e) => toast.error("Couldn't send it", errorMessage(e)),
              },
            )
          }
        />
      }
    >
      <View className="gap-4">
        <Field label="What do you need" required>
          <Chips options={ASSET_CATEGORIES} value={category} onChange={setCategory} />
        </Field>
        <Field label="Why" required>
          <Input value={reason} onChangeText={setReason} multiline numberOfLines={3} className="min-h-20" />
        </Field>
        <Field label="Needed by">
          <DateField value={neededBy} onChange={setNeededBy} placeholder="No particular date" title="Needed by" />
        </Field>
      </View>
    </Sheet>
  );
}
