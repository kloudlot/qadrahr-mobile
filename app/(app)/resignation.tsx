import { useState } from "react";
import { Pressable, View } from "react-native";
import { Check, DoorOpen } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { DetailRow, Divider, ListCard, ListRow, Section } from "@/components/ui/List";
import { DateField } from "@/components/ui/Pickers";
import { Screen } from "@/components/ui/Screen";
import { Sheet } from "@/components/ui/Sheet";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDate, isoDate } from "@/lib/format";
import { useMyResignations, useResign, useWithdrawResignation } from "@/lib/queries/resignation";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

const STATUS_TEXT: Record<string, string> = {
  pending: "Waiting for approval. You can still withdraw it.",
  accepted:
    "Accepted. You stay employed and paid until your last working day, when HR records your exit. To withdraw it now, speak to HR.",
  completed: "Your exit has been recorded.",
  rejected: "Not accepted. You can talk to your manager or HR, or submit again.",
  cancelled: "Withdrawn.",
};

/** Giving notice — and following it through approval to the last day. */
export default function ResignationScreen() {
  const list = useMyResignations();
  const withdraw = useWithdrawResignation();
  const [open, setOpen] = useState(false);

  const all = list.data ?? [];
  const current = all.find((r) => r.status === "pending" || r.status === "accepted");
  const past = all.filter((r) => r !== current);

  return (
    <>
      <Screen
        header={<ScreenHeader title="Resignation" />}
        footer={
          current?.status === "pending" ? (
            <Button
              label="Withdraw my resignation"
              variant="secondary"
              size="lg"
              block
              loading={withdraw.isPending}
              onPress={() =>
                withdraw.mutate(current._id, {
                  onSuccess: () => toast.success("Resignation withdrawn"),
                  onError: (error) => toast.error("Couldn't withdraw it", errorMessage(error)),
                })
              }
            />
          ) : !current && list.isSuccess ? (
            <Button label="Resign" variant="danger" size="lg" block onPress={() => setOpen(true)} />
          ) : null
        }
      >
        <View className="gap-6 pt-2">
          {list.isLoading ? (
            <SkeletonList rows={2} />
          ) : list.error ? (
            <ErrorView message={errorMessage(list.error)} onRetry={() => void list.refetch()} />
          ) : current ? (
            <Card className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text variant="micro" className="text-text-secondary">
                  Your resignation
                </Text>
                <StatusBadge status={current.status} />
              </View>
              <Text variant="h1" className="text-text-primary">
                {formatDate(current.lastWorkingDay)}
              </Text>
              <Text variant="caption" className="-mt-2 text-text-secondary">
                Last working day
              </Text>
              <DetailRow label="Submitted" value={formatDate(current.createdAt)} />
              <View className="gap-1">
                <Text variant="small" className="text-text-secondary">
                  Reason
                </Text>
                <Text variant="body" className="text-text-primary">
                  {current.reason}
                </Text>
              </View>
              <Text variant="small" className="rounded-xl bg-bg-inset px-3 py-2.5 text-text-body">
                {STATUS_TEXT[current.status]}
              </Text>
            </Card>
          ) : (
            <Card>
              <EmptyView
                compact
                icon={DoorOpen}
                title="No resignation in progress"
                detail="If you decide to leave, give notice here. It goes to your manager and HR for approval, and you stay on payroll until your last day."
              />
            </Card>
          )}

          {past.length > 0 ? (
            <Section title="Earlier">
              <ListCard>
                {past.map((r, i) => (
                  <View key={r._id}>
                    {i > 0 ? <Divider /> : null}
                    <ListRow
                      title={`Last day ${formatDate(r.lastWorkingDay)}`}
                      subtitle={`Submitted ${formatDate(r.createdAt)}`}
                      right={<StatusBadge status={r.status} />}
                    />
                  </View>
                ))}
              </ListCard>
            </Section>
          ) : null}
        </View>
      </Screen>

      <ResignSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ResignSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useThemeColors();
  const resign = useResign();
  const [lastWorkingDay, setLastWorkingDay] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(lastWorkingDay && reason.trim() && confirmed);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      dismissable={!resign.isPending}
      title="Resign"
      subtitle="Your manager and HR will review it. Nothing changes until it's accepted."
      footer={
        <Button
          label="Submit resignation"
          variant="danger"
          size="lg"
          block
          disabled={!ready}
          loading={resign.isPending}
          onPress={() => {
            if (!lastWorkingDay) return;
            resign.mutate(
              { lastWorkingDay, reason: reason.trim() },
              {
                onSuccess: () => {
                  toast.success("Resignation submitted", "You'll be told when it's decided.");
                  onClose();
                },
                onError: (e) => setError(errorMessage(e)),
              },
            );
          }}
        />
      }
    >
      <Field label="Last working day" required>
        <DateField value={lastWorkingDay} onChange={setLastWorkingDay} min={isoDate(new Date())} title="Last working day" />
      </Field>
      <Field label="Reason" required hint="Shared with your manager and HR." error={error}>
        <Input value={reason} onChangeText={setReason} multiline maxLength={1000} />
      </Field>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: confirmed }}
        onPress={() => setConfirmed((c) => !c)}
        className="flex-row items-start gap-3"
      >
        <View
          className={cn(
            "mt-0.5 h-6 w-6 items-center justify-center rounded-md border-2",
            confirmed ? "border-brand bg-brand" : "border-border-strong",
          )}
        >
          {confirmed ? <Check size={14} color={colors.onBrand} strokeWidth={3} /> : null}
        </View>
        <Text variant="small" className="flex-1 text-text-body">
          I understand that once it&apos;s accepted, only HR can withdraw it.
        </Text>
      </Pressable>
    </Sheet>
  );
}
