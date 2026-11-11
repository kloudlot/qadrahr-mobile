import { useState } from "react";
import { Alert, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Plus } from "lucide-react-native";

import { ReviewForm } from "@/components/performance/ReviewForm";
import { ErrorView } from "@/components/state/StateViews";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { Divider, Section } from "@/components/ui/List";
import { DateField } from "@/components/ui/Pickers";
import { Screen } from "@/components/ui/Screen";
import { Sheet } from "@/components/ui/Sheet";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  GOAL_PHASES,
  percent,
  phaseLabel,
  weightTotal,
  type Phase,
} from "@/lib/performance";
import {
  useActivateGoals,
  useAddGoal,
  useSaveManagerReview,
  useTeamReport,
  useUpdateGoal,
  type Goal,
  type TeamReportDetail,
} from "@/lib/queries/performance";

/**
 * One direct report: agree their goals, read their self-review and the
 * anonymous feedback about them, and write their review. A promotion or
 * increment is proposed from the web, where the grades and pay bands are.
 */
export default function TeamReportScreen() {
  const { employeeId, cycleId } = useLocalSearchParams<{
    employeeId: string;
    cycleId: string;
  }>();
  const detail = useTeamReport(cycleId, employeeId);
  const review = useSaveManagerReview(cycleId, employeeId);
  const d = detail.data;

  return (
    <Screen
      header={
        <ScreenHeader
          title={d?.employee.name ?? "Report"}
          subtitle={d?.cycle.name}
        />
      }
    >
      {detail.isLoading ? (
        <SkeletonList rows={5} />
      ) : detail.error || !d ? (
        <ErrorView
          message={errorMessage(detail.error)}
          onRetry={() => void detail.refetch()}
        />
      ) : (
        <View className="gap-6 pt-2">
          <Goals detail={d} cycleId={cycleId} employeeId={employeeId} />

          <Section title="Their self-review">
            <Card>
              {d.selfReview ? (
                <SubmittedReview review={d.selfReview} goals={d.goals} />
              ) : (
                <Text variant="small" className="text-text-secondary">
                  Not submitted yet.
                </Text>
              )}
            </Card>
          </Section>

          <Section title="Feedback from colleagues">
            <Card className="gap-3">
              <Text variant="caption" className="text-text-secondary">
                Peer and upward feedback, without names. It informs your review;
                it is not scored.
              </Text>
              {d.feedback.length === 0 ? (
                <Text variant="small" className="text-text-secondary">
                  {d.feedbackHeld > 0
                    ? `${d.feedbackHeld} response held back — feedback is shown once at least two people have given it, so nobody can be identified.`
                    : "None yet."}
                </Text>
              ) : (
                d.feedback.map((f, i) => (
                  <View key={i} className="gap-1 rounded-xl bg-bg-inset p-3">
                    <Badge>
                      {f.reviewType === "upward"
                        ? "From a report"
                        : "From a colleague"}
                    </Badge>
                    {f.strengths ? (
                      <Line label="Does well" text={f.strengths} />
                    ) : null}
                    {f.developmentAreas ? (
                      <Line label="Could change" text={f.developmentAreas} />
                    ) : null}
                    {f.overallComment ? (
                      <Text variant="small" className="text-text-body">
                        {f.overallComment}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </Card>
          </Section>

          <Section title={`Your review of ${d.employee.name}`}>
            {d.cycle.phase !== "manager_review" && !d.myReview ? (
              <Card>
                <Text variant="small" className="text-text-secondary">
                  Manager reviews are written during manager review.{" "}
                  {phaseLabel(d.cycle.phase)} now.
                </Text>
              </Card>
            ) : (
              <ReviewForm
                key={d.myReview?.status ?? "new"}
                goals={d.goals.filter((g) =>
                  ["active", "achieved", "missed"].includes(g.status),
                )}
                competencies={d.competencies}
                scale={d.cycle.ratingScale}
                review={d.myReview}
                readOnly={d.cycle.phase !== "manager_review"}
                requireComplete
                saving={review.isPending}
                submitWarning={`Once submitted, your review of ${d.employee.name} can no longer be changed. It becomes their rating, subject to calibration.`}
                onSave={(body) =>
                  review.mutate(body, {
                    onSuccess: () =>
                      toast.success(
                        body.submit ? "Review submitted" : "Draft saved",
                      ),
                    onError: (error) =>
                      toast.error("Couldn't save it", errorMessage(error)),
                  })
                }
              />
            )}
          </Section>

          {d.appraisal &&
          d.appraisal.finalRating !== undefined &&
          d.appraisal.finalRating !== null ? (
            <Section title="Outcome">
              <Card className="gap-2">
                <Text variant="body" className="text-text-primary">
                  <Text
                    variant="body"
                    className="font-semibold text-text-primary"
                  >
                    {d.appraisal.finalRating}
                  </Text>
                  {d.appraisal.ratingLabel
                    ? ` · ${d.appraisal.ratingLabel}`
                    : ""}
                </Text>
                {d.appraisal.employeeAgreement ? (
                  <Text variant="small" className="text-text-body">
                    {d.employee.name}{" "}
                    {d.appraisal.employeeAgreement === "agree"
                      ? "agrees"
                      : "disagrees"}
                    {d.appraisal.employeeComment
                      ? `: “${d.appraisal.employeeComment}”`
                      : "."}
                  </Text>
                ) : null}
                <Text variant="caption" className="text-text-secondary">
                  To recommend a promotion or increment, use the web, where the
                  grades and pay bands are.
                </Text>
              </Card>
            </Section>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function Goals({
  detail: d,
  cycleId,
  employeeId,
}: {
  detail: TeamReportDetail;
  cycleId: string;
  employeeId: string;
}) {
  const activate = useActivateGoals(cycleId, employeeId);
  const [editing, setEditing] = useState<Goal | "new" | null>(null);
  const goalPhase = GOAL_PHASES.includes(d.cycle.phase as Phase);
  const total = weightTotal(d.goals);
  const hasDrafts = d.goals.some((g) => g.status === "draft");

  return (
    <Section title="Goals">
      <Card className="gap-3">
        <Text
          variant="caption"
          className={total === 100 ? "text-text-secondary" : "text-warning-ink"}
        >
          Weights total {total}%
          {total !== 100 ? " — they must total 100% to activate" : ""}
        </Text>
        {d.goals.length === 0 ? (
          <Text variant="small" className="text-text-secondary">
            {goalPhase
              ? "No goals yet — add them, then activate."
              : "No goals were set in this cycle."}
          </Text>
        ) : (
          d.goals.map((goal, i) => (
            <View key={goal._id} className="gap-2">
              {i > 0 ? <Divider inset={0} /> : null}
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 gap-0.5">
                  <Text
                    variant="body"
                    className="font-medium text-text-primary"
                  >
                    {goal.title}
                  </Text>
                  <Text variant="caption" className="text-text-secondary">
                    {[
                      percent(goal.weight),
                      goal.measure,
                      goal.dueDate ? `due ${formatDate(goal.dueDate)}` : null,
                      `${goal.progress}% done`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                <StatusBadge status={goal.status} />
              </View>
              {goalPhase && goal.status === "draft" ? (
                <Button
                  label="Edit"
                  variant="ghost"
                  onPress={() => setEditing(goal)}
                />
              ) : null}
            </View>
          ))
        )}
        {goalPhase ? (
          <View className="gap-2">
            <Button
              label="Add goal"
              icon={Plus}
              variant="soft"
              block
              onPress={() => setEditing("new")}
            />
            {hasDrafts ? (
              <Button
                label="Agree and activate goals"
                block
                loading={activate.isPending}
                onPress={() =>
                  Alert.alert(
                    "Agree these goals?",
                    `They become the goals ${d.employee.name} is rated on. ${d.employee.name} is told.`,
                    [
                      { text: "Not yet", style: "cancel" },
                      {
                        text: "Activate",
                        onPress: () =>
                          activate.mutate(undefined, {
                            onSuccess: () =>
                              toast.success("Goals agreed and activated"),
                            onError: (error) =>
                              toast.error(
                                "Couldn't activate them",
                                errorMessage(error),
                              ),
                          }),
                      },
                    ],
                  )
                }
              />
            ) : null}
          </View>
        ) : null}
      </Card>
      {editing ? (
        <GoalSheet
          goal={editing === "new" ? null : editing}
          name={d.employee.name}
          cycleId={cycleId}
          employeeId={employeeId}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Section>
  );
}

/** Add a goal, or change a draft one. Weights are entered as percentages; the API takes fractions. */
function GoalSheet({
  goal,
  name,
  cycleId,
  employeeId,
  onClose,
}: {
  goal: Goal | null;
  name: string;
  cycleId: string;
  employeeId: string;
  onClose: () => void;
}) {
  const add = useAddGoal(cycleId, employeeId);
  const update = useUpdateGoal(cycleId, employeeId);
  const [title, setTitle] = useState(goal?.title ?? "");
  const [weight, setWeight] = useState(
    goal ? String(Math.round(goal.weight * 1000) / 10) : "",
  );
  const [measure, setMeasure] = useState(goal?.measure ?? "");
  const [dueDate, setDueDate] = useState<string | null>(
    goal?.dueDate?.slice(0, 10) ?? null,
  );
  const [description, setDescription] = useState(goal?.description ?? "");
  const [status, setStatus] = useState<"draft" | "cancelled">("draft");
  const weightValue = Number(weight);
  const ready =
    title.trim().length > 0 &&
    weight.trim() !== "" &&
    Number.isFinite(weightValue) &&
    weightValue > 0 &&
    weightValue <= 100;
  const saving = add.isPending || update.isPending;
  const done = {
    onSuccess: () => {
      toast.success(goal ? "Goal updated" : "Goal added");
      onClose();
    },
    onError: (error: unknown) =>
      toast.error("Couldn't save it", errorMessage(error)),
  };

  const save = () => {
    const fields = {
      title: title.trim(),
      weight: weightValue / 100,
      measure: measure.trim() || undefined,
      dueDate: dueDate ?? undefined,
      description: description.trim() || undefined,
    };
    if (!goal) return add.mutate(fields, done);
    // Only what changed: the API refuses edits it doesn't need to make.
    const changed = Object.fromEntries(
      Object.entries({
        ...fields,
        status: status === "cancelled" ? "cancelled" : undefined,
      }).filter(
        ([key, value]) =>
          value !== undefined &&
          value !==
            (key === "dueDate"
              ? goal.dueDate?.slice(0, 10)
              : (goal as Record<string, unknown>)[key]),
      ),
    );
    update.mutate({ goalId: goal._id, ...changed }, done);
  };

  return (
    <Sheet
      visible
      onClose={onClose}
      title={goal ? "Change goal" : `Add a goal for ${name}`}
      footer={
        <Button
          label={goal ? "Save" : "Add goal"}
          size="lg"
          block
          disabled={!ready}
          loading={saving}
          onPress={save}
        />
      }
    >
      <View className="gap-4">
        <Field label="Goal" required>
          <Input value={title} onChangeText={setTitle} />
        </Field>
        <Field
          label="Weight (%)"
          required
          hint="A report's goals must add up to 100% before you activate them."
        >
          <Input
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
          />
        </Field>
        <Field label="How it's measured">
          <Input value={measure} onChangeText={setMeasure} />
        </Field>
        <Field label="Due">
          <DateField value={dueDate} onChange={setDueDate} title="Due" />
        </Field>
        <Field label="Description">
          <Input multiline value={description} onChangeText={setDescription} />
        </Field>
        {goal ? (
          <Field label="Status">
            <Select
              title="Status"
              value={status}
              options={[
                { value: "draft", label: "Draft" },
                {
                  value: "cancelled",
                  label: "Cancelled",
                  detail: "No longer a goal they are rated on",
                },
              ]}
              onChange={setStatus}
            />
          </Field>
        ) : null}
      </View>
    </Sheet>
  );
}

function SubmittedReview({
  review,
  goals,
}: {
  review: NonNullable<TeamReportDetail["selfReview"]>;
  goals: Goal[];
}) {
  const title = (id: string) =>
    goals.find((g) => g._id === id)?.title ?? "Goal";
  return (
    <View className="gap-1.5">
      {review.goalRatings.map((r) => (
        <Text key={r.goalId} variant="small" className="text-text-body">
          • {title(r.goalId)}: {r.rating}
          {r.comment ? ` — ${r.comment}` : ""}
        </Text>
      ))}
      {review.competencyRatings.map((r) => (
        <Text key={r.competency} variant="small" className="text-text-body">
          • {r.competency}: {r.rating}
          {r.comment ? ` — ${r.comment}` : ""}
        </Text>
      ))}
      {review.strengths ? (
        <Line label="Strengths" text={review.strengths} />
      ) : null}
      {review.developmentAreas ? (
        <Line label="To develop" text={review.developmentAreas} />
      ) : null}
      {review.overallComment ? (
        <Line label="Overall" text={review.overallComment} />
      ) : null}
    </View>
  );
}

function Line({ label, text }: { label: string; text: string }) {
  return (
    <Text variant="small" className="text-text-body">
      <Text variant="small" className="font-semibold text-text-primary">
        {label}:
      </Text>{" "}
      {text}
    </Text>
  );
}
