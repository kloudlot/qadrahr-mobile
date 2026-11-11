import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Inbox } from "lucide-react-native";

import { SubjectIcon } from "@/components/requests/describe";
import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  describeSubject,
  useApprovalInbox,
  useDecide,
  type ApprovalItem,
  type Decision,
} from "@/lib/queries/approvals";
import { formatMoney } from "@/lib/queries/company";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * Approvals — everything waiting on this person, across every subject
 * type, because that is how an approver holds it: one queue, not one per
 * module.
 *
 * The inbox only ever contains what is genuinely waiting on the caller —
 * the workflow engine resolves approvers server-side, so this screen
 * makes no decision about who may approve what. It shows what arrived.
 */
export default function ApprovalsScreen() {
  const inbox = useApprovalInbox();
  const decide = useDecide();

  const [filter, setFilter] = useState<string | null>(null);
  /** The row a decision is in flight for, so only its buttons spin. */
  const [deciding, setDeciding] = useState<string | null>(null);
  /** The row being declined — a sheet asks whether to return or reject, and why. */
  const [declining, setDeclining] = useState<ApprovalItem | null>(null);

  const rows = inbox.data?.data ?? [];
  const subjectTypes = [...new Set(rows.map((row) => row.subjectType))];
  const visible = filter ? rows.filter((row) => row.subjectType === filter) : rows;

  const submit = (item: ApprovalItem, decision: Decision, comment?: string) => {
    setDeciding(item._id);
    decide.mutate(
      { id: item._id, decision, comment },
      {
        onSuccess: () => {
          toast.success(decision === "approved" ? "Approved" : decision === "returned" ? "Sent back" : "Rejected");
          setDeclining(null);
        },
        onError: (error) => toast.error("That didn't go through", errorMessage(error)),
        onSettled: () => setDeciding(null),
      },
    );
  };

  return (
    <>
      <Screen
        header={<ScreenHeader title="Approvals" subtitle={rows.length ? `${rows.length} waiting on you` : undefined} />}
        refreshing={inbox.isRefetching}
        onRefresh={() => void inbox.refetch()}
      >
        <View className="gap-4 pt-2">
          {subjectTypes.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <FilterChip label="All" active={filter === null} onPress={() => setFilter(null)} />
              {subjectTypes.map((type) => (
                <FilterChip key={type} label={describeSubject(type)} active={filter === type} onPress={() => setFilter(type)} />
              ))}
            </ScrollView>
          ) : null}

          {inbox.isLoading ? (
            <SkeletonList rows={3} />
          ) : inbox.error ? (
            <ErrorView message={errorMessage(inbox.error)} onRetry={() => void inbox.refetch()} />
          ) : visible.length === 0 ? (
            <EmptyView icon={Inbox} title="Queue clear" detail="Nothing is waiting on you. New requests arrive as a push notification." />
          ) : (
            <View className="gap-3">
              {visible.map((item) => (
                <ApprovalCard
                  key={item._id}
                  item={item}
                  busy={deciding === item._id}
                  onApprove={() => submit(item, "approved")}
                  onDecline={() => setDeclining(item)}
                />
              ))}
            </View>
          )}
        </View>
      </Screen>

      <DeclineSheet
        item={declining}
        busy={Boolean(declining && deciding === declining._id)}
        onClose={() => setDeclining(null)}
        onSubmit={(decision, comment) => declining && submit(declining, decision, comment)}
      />
    </>
  );
}

function ApprovalCard({
  item,
  busy,
  onApprove,
  onDecline,
}: {
  item: ApprovalItem;
  busy: boolean;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const colors = useThemeColors();
  const summary = summarise(item);
  // Read once per mount: a clock read during render is impure, and "overdue"
  // does not need to tick.
  const [now] = useState(() => Date.now());
  const overdue = item.dueAt ? Date.parse(item.dueAt) < now : false;

  return (
    <Card className="gap-4">
      <View className="flex-row gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-subtle">
          <SubjectIcon subjectType={item.subjectType} size={22} color={colors.brand} />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text variant="caption" className="text-text-secondary">
            {describeSubject(item.subjectType)}
            {item.requesterName ? ` · ${item.requesterName}` : ""}
          </Text>
          <Text variant="body" className="font-semibold text-text-primary">
            {summary.title}
          </Text>
          {summary.detail ? (
            <Text variant="small" className="text-text-secondary">
              {summary.detail}
            </Text>
          ) : null}
        </View>
        {item.dueAt ? <Badge tone={overdue ? "danger" : "neutral"}>{overdue ? "Overdue" : "Due soon"}</Badge> : null}
      </View>

      <View className="flex-row gap-3">
        <Button label="Decline" variant="secondary" className="flex-1" disabled={busy} onPress={onDecline} />
        <Button label="Approve" className="flex-1" haptic loading={busy} onPress={onApprove} />
      </View>
    </Card>
  );
}

function DeclineSheet({
  item,
  busy,
  onClose,
  onSubmit,
}: {
  item: ApprovalItem | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (decision: Decision, comment: string) => void;
}) {
  const [decision, setDecision] = useState<"returned" | "rejected">("returned");
  const [comment, setComment] = useState("");

  return (
    <Sheet
      visible={Boolean(item)}
      onClose={onClose}
      dismissable={!busy}
      title="Decline"
      subtitle={item ? `${describeSubject(item.subjectType)}${item.requesterName ? ` from ${item.requesterName}` : ""}` : undefined}
      footer={
        <Button
          label={decision === "returned" ? "Send back" : "Reject"}
          variant={decision === "rejected" ? "danger" : "primary"}
          size="lg"
          block
          loading={busy}
          disabled={!comment.trim()}
          onPress={() => onSubmit(decision, comment.trim())}
        />
      }
    >
      <SegmentedControl
        value={decision}
        onChange={setDecision}
        options={[
          { value: "returned", label: "Send back for changes" },
          { value: "rejected", label: "Reject" },
        ]}
      />
      <Text variant="small" className="text-text-secondary">
        {decision === "returned"
          ? "They can fix it and resubmit."
          : "This ends the request. It can't be resubmitted."}
      </Text>
      <Field label="Why" required hint="They see this.">
        <Input value={comment} onChangeText={setComment} multiline maxLength={1000} />
      </Field>
    </Sheet>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={cn("min-h-[38px] justify-center rounded-pill border px-4", active ? "border-brand bg-brand" : "border-border bg-bg-card")}
    >
      <Text variant="small" className={active ? "font-semibold text-brand-ink" : "text-text-primary"}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * A readable line from the raising module's payload.
 *
 * `payload` is untyped on the wire because it differs per subject type,
 * so every read here is defensive: a missing or unexpected field falls
 * back to the subject name rather than rendering "undefined". An
 * approver seeing a blank card cannot decide, but one seeing a wrong
 * number might decide wrongly — so nothing is inferred, only read.
 */
function summarise(item: ApprovalItem): { title: string; detail?: string } {
  const payload = item.payload ?? {};

  const text = (key: string): string | undefined =>
    typeof payload[key] === "string" ? (payload[key] as string) : undefined;
  const num = (key: string): number | undefined =>
    typeof payload[key] === "number" ? (payload[key] as number) : undefined;

  const reference = text("reference");
  const title = text("title");

  // Expense claims carry a total in minor units and its currency.
  const total = num("total");
  const currency = text("currency");
  if (total !== undefined && currency) {
    return {
      title: title ?? reference ?? describeSubject(item.subjectType),
      detail: [formatMoney(total, currency), reference].filter(Boolean).join(" · "),
    };
  }

  // Leave requests carry dates and a day count.
  const startDate = text("startDate");
  const endDate = text("endDate");
  const days = num("days");
  if (startDate && endDate) {
    const span = startDate === endDate ? startDate : `${startDate} – ${endDate}`;
    return {
      title: title ?? describeSubject(item.subjectType),
      detail: days !== undefined ? `${span} · ${days} days` : span,
    };
  }

  return { title: title ?? reference ?? describeSubject(item.subjectType) };
}
