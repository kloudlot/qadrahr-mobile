import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import {
  ClipboardCheck,
  MessageSquare,
  PenLine,
  Target,
  TrendingUp,
  Users,
} from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { Divider, ListCard, ListRow, Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { Sheet } from "@/components/ui/Sheet";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  LIVE_PHASES,
  PHASE_HELP,
  parseProgress,
  percent,
  phaseLabel,
  preferredCycle,
  type Phase,
} from "@/lib/performance";
import {
  useMyAppraisals,
  useMyCycles,
  useMyGoals,
  useOwedReviews,
  useTeamCycles,
  useUpdateProgress,
  type Goal,
  type OwedReview,
} from "@/lib/queries/performance";

/**
 * The employee's performance: what they owe now, their goals and progress,
 * their self-review, feedback for colleagues, and their appraisals.
 * Opens on the cycle that needs them, not just the newest one.
 */
export default function PerformanceScreen() {
  const cycles = useMyCycles();
  const appraisals = useMyAppraisals();
  const team = useTeamCycles();
  const [chosen, setChosen] = useState<string | null>(null);

  const list = cycles.data ?? [];
  const cycle = list.find((c) => c._id === chosen) ?? preferredCycle(list);
  const goals = useMyGoals(cycle?._id);
  const owed = useOwedReviews(cycle?._id);
  const live = !!cycle && LIVE_PHASES.includes(cycle.phase as Phase);
  const isManager = (team.data?.length ?? 0) > 0;

  const refresh = () => {
    void cycles.refetch();
    void appraisals.refetch();
    void goals.refetch();
    void owed.refetch();
  };

  // Self-service is for employees: an account with no employee record behind it has nothing here.
  const unlinked =
    (appraisals.error as { response?: { status?: number } } | null)?.response
      ?.status === 404 && list.length === 0;

  return (
    <Screen
      header={<ScreenHeader title="Performance" />}
      refreshing={cycles.isRefetching}
      onRefresh={refresh}
    >
      {cycles.isLoading ? (
        <SkeletonList rows={4} />
      ) : unlinked ? (
        <EmptyView
          icon={TrendingUp}
          title="Your account isn't linked to an employee record"
          detail="Performance reviews are for employees. Ask HR to link your self-service access."
        />
      ) : cycles.error ? (
        <ErrorView
          message={errorMessage(cycles.error)}
          onRetry={() => void cycles.refetch()}
        />
      ) : (
        <View className="gap-6 pt-2">
          {isManager ? (
            <ListCard>
              <ListRow
                icon={Users}
                title="Team reviews"
                subtitle="Agree your reports' goals and write their reviews"
                onPress={() => router.push("/performance/team")}
              />
            </ListCard>
          ) : null}

          {!cycle ? (
            <EmptyView
              compact
              icon={Target}
              title="No review cycle yet"
              detail="When HR opens a performance cycle that includes you, it appears here."
            />
          ) : (
            <>
              <View className="gap-3">
                {list.length > 1 ? (
                  <Select
                    title="Review cycle"
                    value={cycle._id}
                    options={list.map((c) => ({
                      value: c._id,
                      label: c.name,
                      detail: `${phaseLabel(c.phase)}${c.owed ? ` · ${c.owed} to do` : ""}`,
                    }))}
                    onChange={setChosen}
                  />
                ) : null}
                <Card className="gap-1">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text variant="h3" className="flex-1 text-text-primary">
                      {cycle.name}
                    </Text>
                    <Badge tone={live ? "brand" : "neutral"}>
                      {phaseLabel(cycle.phase)}
                    </Badge>
                  </View>
                  <Text variant="caption" className="text-text-secondary">
                    {formatDate(cycle.periodStart)} –{" "}
                    {formatDate(cycle.periodEnd)}
                  </Text>
                  {PHASE_HELP[cycle.phase as Phase] ? (
                    <Text variant="small" className="mt-1 text-text-body">
                      {PHASE_HELP[cycle.phase as Phase]}
                    </Text>
                  ) : null}
                </Card>
              </View>

              <Owed
                items={owed.data ?? []}
                loading={owed.isLoading}
                cycleId={cycle._id}
              />

              <Section title="Goals">
                {goals.isLoading ? (
                  <SkeletonList rows={2} />
                ) : (
                  <GoalList
                    goals={(goals.data ?? []).filter(
                      (g) => g.status !== "cancelled",
                    )}
                    live={live}
                    cycleId={cycle._id}
                  />
                )}
              </Section>

              <Section title="Reviews">
                <ListCard>
                  <ListRow
                    icon={PenLine}
                    title="My self-review"
                    subtitle={
                      cycle.phase === "self_review"
                        ? "Open now"
                        : `Written during self-review`
                    }
                    onPress={() =>
                      router.push({
                        pathname: "/performance/self-review",
                        params: { cycleId: cycle._id },
                      })
                    }
                  />
                  <Divider inset={68} />
                  <ListRow
                    icon={MessageSquare}
                    iconTone="info"
                    title="Give feedback"
                    subtitle="For a colleague or your manager — your name isn't shown"
                    onPress={() =>
                      router.push({
                        pathname: "/performance/feedback",
                        params: { cycleId: cycle._id },
                      })
                    }
                  />
                </ListCard>
              </Section>
            </>
          )}

          <Section title="Appraisals">
            {appraisals.isLoading ? (
              <SkeletonList rows={2} />
            ) : (appraisals.data ?? []).length === 0 ? (
              <Card>
                <EmptyView
                  compact
                  icon={ClipboardCheck}
                  title="No appraisals yet"
                  detail="Once your rating has been calibrated and shared, it appears here with how it was reached."
                />
              </Card>
            ) : (
              <ListCard>
                {(appraisals.data ?? []).map((appraisal, i) => (
                  <View key={appraisal._id}>
                    {i > 0 ? <Divider inset={68} /> : null}
                    <ListRow
                      icon={ClipboardCheck}
                      iconTone="success"
                      title={appraisal.cycleName}
                      subtitle={`${appraisal.finalRating ?? "—"}${appraisal.ratingLabel ? ` · ${appraisal.ratingLabel}` : ""}`}
                      right={
                        appraisal.employeeAgreement ? null : (
                          <Badge tone="warning">Respond</Badge>
                        )
                      }
                      onPress={() =>
                        router.push(`/performance/appraisal/${appraisal._id}`)
                      }
                    />
                  </View>
                ))}
              </ListCard>
            )}
          </Section>
        </View>
      )}
    </Screen>
  );
}

function Owed({
  items,
  loading,
  cycleId,
}: {
  items: OwedReview[];
  loading: boolean;
  cycleId: string;
}) {
  if (loading || items.length === 0) return null;
  const open = (item: OwedReview) => {
    if (item.reviewType === "self")
      router.push({
        pathname: "/performance/self-review",
        params: { cycleId },
      });
    else if (item.reviewType === "manager")
      router.push({
        pathname: "/performance/team/[employeeId]",
        params: { employeeId: item.employeeId, cycleId },
      });
    else
      router.push({
        pathname: "/performance/feedback",
        params: { cycleId, employeeId: item.employeeId },
      });
  };
  return (
    <Section title="To do">
      <ListCard>
        {items.map((item, i) => (
          <View key={`${item.reviewType}-${item.employeeId}`}>
            {i > 0 ? <Divider inset={68} /> : null}
            <ListRow
              icon={
                item.reviewType === "self"
                  ? PenLine
                  : item.reviewType === "manager"
                    ? Users
                    : MessageSquare
              }
              iconTone="warning"
              title={
                item.reviewType === "self"
                  ? "Your self-review"
                  : item.reviewType === "manager"
                    ? `Review ${item.employeeName}`
                    : item.reviewType === "upward"
                      ? `Feedback for your manager, ${item.employeeName}`
                      : `Feedback for ${item.employeeName}`
              }
              subtitle={`${item.status === "draft" ? "Draft saved — not sent yet" : "Not started"} · due before ${phaseLabel(item.phase)} ends`}
              onPress={() => open(item)}
            />
          </View>
        ))}
      </ListCard>
    </Section>
  );
}

function GoalList({
  goals,
  live,
  cycleId,
}: {
  goals: Goal[];
  live: boolean;
  cycleId: string;
}) {
  const [editing, setEditing] = useState<Goal | null>(null);
  if (goals.length === 0) {
    return (
      <Card>
        <EmptyView
          compact
          icon={Target}
          title="No goals for this cycle yet"
          detail="Your manager sets and agrees your goals during goal setting."
        />
      </Card>
    );
  }
  return (
    <View className="gap-3">
      {goals.map((goal) => (
        <Card key={goal._id} className="gap-3">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-0.5">
              <Text variant="body" className="font-semibold text-text-primary">
                {goal.title}
              </Text>
              {goal.measure ? (
                <Text variant="caption" className="text-text-secondary">
                  Measured by: {goal.measure}
                </Text>
              ) : null}
            </View>
            <StatusBadge status={goal.status} />
          </View>
          <ProgressBar value={goal.progress} label={goal.title} />
          <View className="flex-row items-center justify-between gap-3">
            <Text variant="caption" className="text-text-secondary">
              {percent(goal.weight)} of your goals
              {goal.dueDate ? ` · due ${formatDate(goal.dueDate)}` : ""}
            </Text>
            {live && goal.status === "active" ? (
              <Button
                label="Update"
                variant="soft"
                onPress={() => setEditing(goal)}
              />
            ) : null}
          </View>
        </Card>
      ))}
      {editing ? (
        <ProgressSheet
          goal={editing}
          cycleId={cycleId}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </View>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View className="gap-1">
      <View className="flex-row justify-between">
        <Text variant="caption" className="text-text-secondary">
          Progress
        </Text>
        <Text
          variant="caption"
          tabular
          className="font-semibold text-text-primary"
        >
          {pct}%
        </Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`Progress on ${label}`}
        accessibilityValue={{ min: 0, max: 100, now: pct }}
        className="h-2 overflow-hidden rounded-full bg-bg-inset"
      >
        <View
          className="h-full rounded-full bg-brand"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}

function ProgressSheet({
  goal,
  cycleId,
  onClose,
}: {
  goal: Goal;
  cycleId: string;
  onClose: () => void;
}) {
  const update = useUpdateProgress(cycleId);
  const [text, setText] = useState(String(goal.progress ?? 0));
  const progress = parseProgress(text);
  return (
    <Sheet
      visible
      onClose={onClose}
      title="Update progress"
      subtitle={goal.title}
      footer={
        <Button
          label="Save"
          size="lg"
          block
          disabled={progress === null}
          loading={update.isPending}
          onPress={() =>
            progress !== null &&
            update.mutate(
              { goalId: goal._id, progress },
              {
                onSuccess: () => {
                  toast.success("Progress updated");
                  onClose();
                },
                onError: (error) =>
                  toast.error("Couldn't save it", errorMessage(error)),
              },
            )
          }
        />
      }
    >
      <Field label="How far along is it? (%)" hint="0 to 100.">
        <Input
          keyboardType="number-pad"
          value={text}
          onChangeText={setText}
          autoFocus
        />
      </Field>
    </Sheet>
  );
}
