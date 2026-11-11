import { useState } from "react";
import { Alert, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { Text } from "@/components/ui/Text";
import {
  draftFrom,
  percent,
  ratedCount,
  reviewBody,
  type Rating,
  type ReviewBody,
} from "@/lib/performance";
import type { Competency, Review, ScaleLevel } from "@/lib/queries/performance";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

type RatedGoal = {
  _id: string;
  title: string;
  weight: number;
  measure?: string;
};

/**
 * A review form — the employee's self-review or a manager's review of a
 * report. Starts from the saved draft, saves a draft to come back to, and
 * submits once, after a confirmation, because a submitted review can't be
 * changed. Give it a `key` per subject so typing for one person never
 * carries over to the next.
 */
export function ReviewForm({
  goals,
  competencies,
  scale,
  review,
  readOnly,
  requireComplete,
  saving,
  submitWarning,
  onSave,
}: {
  goals: RatedGoal[];
  competencies: Competency[];
  scale: ScaleLevel[];
  review: Review | null;
  readOnly?: boolean;
  /** A manager review must rate everything before it can be submitted. */
  requireComplete?: boolean;
  saving?: boolean;
  submitWarning: string;
  onSave: (body: ReviewBody) => void;
}) {
  const colors = useThemeColors();
  const [draft, setDraft] = useState(() => draftFrom(review));
  const submitted = review?.status === "submitted";
  const locked = readOnly || submitted;
  const { rated, total } = ratedCount(
    draft,
    goals.map((goal) => goal._id),
    competencies.map((competency) => competency.name),
  );
  const complete = rated === total;

  const setGoal = (id: string, patch: Rating) =>
    setDraft((d) => ({
      ...d,
      goals: { ...d.goals, [id]: { ...d.goals[id], ...patch } },
    }));
  const setCompetency = (name: string, patch: Rating) =>
    setDraft((d) => ({
      ...d,
      competencies: {
        ...d.competencies,
        [name]: { ...d.competencies[name], ...patch },
      },
    }));

  const submit = () =>
    Alert.alert("Submit review?", submitWarning, [
      { text: "Not yet", style: "cancel" },
      { text: "Submit", onPress: () => onSave(reviewBody(draft, true)) },
    ]);

  return (
    <View className="gap-4">
      {submitted ? (
        <View className="flex-row items-center gap-2 rounded-xl bg-success-subtle p-3">
          <CheckCircle2 size={16} color={colors.success} />
          <Text variant="small" className="flex-1 text-success-ink">
            Submitted — it can no longer be changed.
          </Text>
        </View>
      ) : null}

      <Card className="gap-4">
        <Text variant="h3" className="text-text-primary">
          Goals
        </Text>
        {goals.length === 0 ? (
          <Text variant="small" className="text-text-secondary">
            No active goals to rate.
          </Text>
        ) : (
          goals.map((goal) => (
            <RatedItem
              key={goal._id}
              title={goal.title}
              detail={[percent(goal.weight), goal.measure]
                .filter(Boolean)
                .join(" · ")}
              scale={scale}
              value={draft.goals[goal._id]}
              locked={locked}
              onChange={(patch) => setGoal(goal._id, patch)}
            />
          ))
        )}
      </Card>

      {competencies.length > 0 ? (
        <Card className="gap-4">
          <View className="gap-0.5">
            <Text variant="h3" className="text-text-primary">
              Competencies
            </Text>
            <Text variant="caption" className="text-text-secondary">
              How the work was done, for this grade.
            </Text>
          </View>
          {competencies.map((competency) => (
            <RatedItem
              key={competency.name}
              title={competency.name}
              detail={[percent(competency.weight), competency.description]
                .filter(Boolean)
                .join(" · ")}
              scale={scale}
              value={draft.competencies[competency.name]}
              locked={locked}
              onChange={(patch) => setCompetency(competency.name, patch)}
            />
          ))}
        </Card>
      ) : null}

      <Card className="gap-4">
        <Text variant="h3" className="text-text-primary">
          In your words
        </Text>
        {(
          [
            ["strengths", "Strengths"],
            ["developmentAreas", "Development areas"],
            ["overallComment", "Overall comment"],
          ] as const
        ).map(([field, label]) => (
          <Field key={field} label={label}>
            <Input
              multiline
              editable={!locked}
              value={draft[field]}
              onChangeText={(text) =>
                setDraft((d) => ({ ...d, [field]: text }))
              }
            />
          </Field>
        ))}
      </Card>

      {!locked ? (
        <View className="gap-2">
          <Text variant="caption" className="text-center text-text-secondary">
            {rated} of {total} rated
            {requireComplete && !complete ? " — rate everything to submit" : ""}
          </Text>
          <Button
            label="Submit"
            size="lg"
            block
            loading={saving}
            disabled={requireComplete && !complete}
            onPress={submit}
          />
          <Button
            label="Save draft"
            variant="secondary"
            size="lg"
            block
            loading={saving}
            onPress={() => onSave(reviewBody(draft, false))}
          />
        </View>
      ) : null}
    </View>
  );
}

function RatedItem({
  title,
  detail,
  scale,
  value,
  locked,
  onChange,
}: {
  title: string;
  detail?: string;
  scale: ScaleLevel[];
  value: Rating | undefined;
  locked?: boolean;
  onChange: (patch: Rating) => void;
}) {
  const label = scale.find((level) => level.value === value?.rating)?.label;
  return (
    <View className="gap-2">
      <View className="gap-0.5">
        <Text variant="body" className="font-medium text-text-primary">
          {title}
        </Text>
        {detail ? (
          <Text variant="caption" className="text-text-secondary">
            {detail}
          </Text>
        ) : null}
      </View>
      {locked ? (
        <Text variant="small" className="text-text-body">
          {value?.rating !== undefined
            ? `Rated ${value.rating}${label ? ` · ${label}` : ""}`
            : "Not rated"}
          {value?.comment ? ` — ${value.comment}` : ""}
        </Text>
      ) : (
        <>
          {/* Only the cycle's own levels can be chosen: nothing off the scale. */}
          <Select
            title={`Rate ${title}`}
            placeholder="Rate…"
            value={value?.rating !== undefined ? String(value.rating) : null}
            options={scale.map((level) => ({
              value: String(level.value),
              label: `${level.value} · ${level.label}`,
              detail: level.description,
            }))}
            onChange={(rating) => onChange({ rating: Number(rating) })}
          />
          <Input
            placeholder="Comment (optional)"
            accessibilityLabel={`Comment on ${title}`}
            value={value?.comment ?? ""}
            onChangeText={(comment) => onChange({ comment })}
          />
        </>
      )}
    </View>
  );
}
