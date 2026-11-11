import { useState } from "react";
import { View } from "react-native";
import { LifeBuoy } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { DetailRow, Divider, ListCard, ListRow, Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { Sheet } from "@/components/ui/Sheet";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useCaseAction, useMyCases, type Case, type CaseStage } from "@/lib/queries/workplace";

const TYPE_LABEL: Record<Case["caseType"], string> = {
  query: "Query",
  warning: "Warning",
  misconduct: "Misconduct",
  grievance: "Grievance",
  pip: "Improvement plan",
};

const STAGE: Record<CaseStage, { tone: Tone; label: string }> = {
  draft: { tone: "neutral", label: "Draft" },
  raised: { tone: "info", label: "Raised" },
  awaiting_response: { tone: "warning", label: "Your response" },
  hearing: { tone: "info", label: "Hearing" },
  decided: { tone: "brand", label: "Decided" },
  closed: { tone: "neutral", label: "Closed" },
  appealed: { tone: "info", label: "Appealed" },
  withdrawn: { tone: "neutral", label: "Withdrawn" },
};

const SANCTION_LABEL: Record<Case["sanction"], string> = {
  none: "None",
  verbal_warning: "Verbal warning",
  written_warning: "Written warning",
  final_written_warning: "Final written warning",
  suspension: "Suspension",
  demotion: "Demotion",
  dismissal: "Dismissal",
};

/**
 * Cases about me — queries, warnings, grievances — with my right to
 * answer one and to appeal its decision. Both are time-bound, so a case
 * waiting on me is shown first.
 */
export default function CasesScreen() {
  const cases = useMyCases();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = [...(cases.data ?? [])].sort(
    (a, b) =>
      Number(needsMe(b)) - Number(needsMe(a)) || b.createdAt.localeCompare(a.createdAt),
  );
  // Looked up by id so the sheet shows the case as refetched after answering.
  const selected = rows.find((row) => row._id === selectedId) ?? null;

  return (
    <>
      <Screen
        header={<ScreenHeader title="Cases about me" subtitle="Your right to respond and to appeal" />}
        refreshing={cases.isRefetching}
        onRefresh={() => void cases.refetch()}
      >
        <View className="pt-2">
          {cases.isLoading ? (
            <SkeletonList rows={3} />
          ) : cases.error ? (
            <ErrorView message={errorMessage(cases.error)} onRetry={() => void cases.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyView icon={LifeBuoy} title="No cases" detail="There are no employee relations matters about you." />
          ) : (
            <ListCard>
              {rows.map((row, i) => (
                <View key={row._id}>
                  {i > 0 ? <Divider inset={68} /> : null}
                  <ListRow
                    icon={LifeBuoy}
                    iconTone={needsMe(row) ? "warning" : "neutral"}
                    title={row.title}
                    subtitle={`${TYPE_LABEL[row.caseType]} · ${row.reference} · ${formatDate(row.createdAt)}`}
                    right={<Badge tone={STAGE[row.stage].tone}>{STAGE[row.stage].label}</Badge>}
                    onPress={() => setSelectedId(row._id)}
                  />
                </View>
              ))}
            </ListCard>
          )}
        </View>
      </Screen>

      <CaseSheet record={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}

/** What the employee can act on: the server takes a response only while awaiting one, and an appeal only once decided. */
function needsMe(record: Case): boolean {
  return record.stage === "awaiting_response" || record.stage === "decided";
}

function CaseSheet({ record, onClose }: { record: Case | null; onClose: () => void }) {
  const action = useCaseAction();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mode = record?.stage === "awaiting_response" ? "respond" : record?.stage === "decided" ? "appeal" : null;

  const close = () => {
    setText("");
    setError(null);
    onClose();
  };

  return (
    <Sheet
      visible={Boolean(record)}
      onClose={close}
      dismissable={!action.isPending}
      title={record?.title}
      subtitle={record ? `${TYPE_LABEL[record.caseType]} · ${record.reference}` : undefined}
      footer={
        record && mode ? (
          <Button
            label={mode === "respond" ? "Send my response" : "Lodge my appeal"}
            size="lg"
            block
            haptic
            disabled={text.trim().length < 3}
            loading={action.isPending}
            onPress={() =>
              action.mutate(
                { id: record._id, mode, text: text.trim() },
                {
                  onSuccess: () => {
                    toast.success(mode === "respond" ? "Response sent" : "Appeal lodged", "It's on the case file.");
                    setText("");
                  },
                  onError: (e) => setError(errorMessage(e)),
                },
              )
            }
          />
        ) : null
      }
    >
      {record ? (
        <View className="gap-4">
          <View>
            <DetailRow label="Stage" value={<Badge tone={STAGE[record.stage].tone}>{STAGE[record.stage].label}</Badge>} />
            <DetailRow label="Severity" value={record.severity.charAt(0).toUpperCase() + record.severity.slice(1)} />
            <DetailRow label="Opened" value={formatDate(record.createdAt)} />
            {record.responseDueBy && record.stage === "awaiting_response" ? (
              <DetailRow label="Respond by" value={formatDate(record.responseDueBy)} />
            ) : null}
            {record.hearingDate ? <DetailRow label="Hearing" value={formatDate(record.hearingDate)} /> : null}
            {record.handlerNames?.length ? <DetailRow label="Handled by" value={record.handlerNames.join(", ")} /> : null}
          </View>

          <Block label="What it's about" body={record.details} />
          {record.employeeResponse ? (
            <Block label={`Your response${record.respondedAt ? ` · ${formatDate(record.respondedAt)}` : ""}`} body={record.employeeResponse} />
          ) : null}
          {record.decision ? (
            <Block
              label={`Decision${record.decidedAt ? ` · ${formatDate(record.decidedAt)}` : ""}`}
              body={
                record.sanction !== "none"
                  ? `${record.decision}\n\nSanction: ${SANCTION_LABEL[record.sanction]}${
                      record.sanctionExpiresOn ? `, until ${formatDate(record.sanctionExpiresOn)}` : ""
                    }`
                  : record.decision
              }
            />
          ) : null}
          {record.appealGrounds ? <Block label="Your appeal" body={record.appealGrounds} /> : null}
          {record.appealOutcome ? <Block label="Appeal outcome" body={record.appealOutcome} /> : null}

          {record.plan ? (
            <Section title="Improvement plan">
              <View>
                <DetailRow label="Runs" value={`${formatDate(record.plan.startDate)} – ${formatDate(record.plan.endDate)}`} />
                <DetailRow label="Reviewed" value={record.plan.cadence.charAt(0).toUpperCase() + record.plan.cadence.slice(1)} />
              </View>
              {record.plan.objectives.map((objective, i) => (
                <Text key={i} variant="small" className="text-text-body">
                  {`${i + 1}. ${objective}`}
                </Text>
              ))}
            </Section>
          ) : null}

          {mode ? (
            <Field
              label={mode === "respond" ? "Your response" : "Grounds for appeal"}
              required
              hint={
                mode === "respond"
                  ? "Recorded on the case file and seen by the panel."
                  : "Say why the decision should be looked at again."
              }
              error={error}
            >
              <Input value={text} onChangeText={setText} multiline maxLength={10_000} placeholder="Set out your account as fully as you'd like" />
            </Field>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <View className="gap-1">
      <Text variant="small" className="text-text-secondary">
        {label}
      </Text>
      <Text variant="body" className="text-text-primary">
        {body}
      </Text>
    </View>
  );
}
