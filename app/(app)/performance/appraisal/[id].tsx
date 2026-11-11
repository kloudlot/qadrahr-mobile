import { useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ChevronDown, ChevronUp } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { Sheet } from "@/components/ui/Sheet";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { percent } from "@/lib/performance";
import {
  useMyAppraisals,
  useRespondToAppraisal,
  type Appraisal,
} from "@/lib/queries/performance";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * An appraisal as its employee reads it: the rating, what it means on the
 * scale, what the manager wrote, how the number was reached, and — if the
 * panel moved it — that it moved and why. Ends with the employee's answer.
 */
export default function AppraisalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appraisals = useMyAppraisals();
  const [responding, setResponding] = useState(false);
  const appraisal = appraisals.data?.find((a) => a._id === id);

  return (
    <Screen
      header={
        <ScreenHeader title="Appraisal" subtitle={appraisal?.cycleName} />
      }
      footer={
        appraisal ? (
          <Button
            label={
              appraisal.employeeAgreement ? "Change my response" : "Respond"
            }
            variant={appraisal.employeeAgreement ? "secondary" : "primary"}
            size="lg"
            block
            onPress={() => setResponding(true)}
          />
        ) : null
      }
    >
      {appraisals.isLoading ? (
        <SkeletonList rows={4} />
      ) : appraisals.error ? (
        <ErrorView
          message={errorMessage(appraisals.error)}
          onRetry={() => void appraisals.refetch()}
        />
      ) : !appraisal ? (
        <EmptyView title="Appraisal not found" />
      ) : (
        <AppraisalView appraisal={appraisal} />
      )}
      {appraisal && responding ? (
        <RespondSheet
          appraisal={appraisal}
          onClose={() => setResponding(false)}
        />
      ) : null}
    </Screen>
  );
}

function AppraisalView({ appraisal }: { appraisal: Appraisal }) {
  const max = Math.max(...appraisal.ratingScale.map((level) => level.value));
  const m = appraisal.manager;
  return (
    <View className="gap-4 pt-2">
      <View className="items-center gap-1 rounded-3xl bg-brand-subtle px-4 py-6">
        <Text variant="micro" className="text-brand">
          Your rating
        </Text>
        <Text variant="display" tabular className="text-text-primary">
          {appraisal.finalRating ?? "—"}
          <Text variant="body" className="text-text-secondary">
            {" "}
            of {max}
          </Text>
        </Text>
        <Text variant="body" className="font-medium text-text-primary">
          {appraisal.ratingLabel ?? "—"}
        </Text>
        <Text variant="caption" className="text-text-secondary">
          Shared {formatDate(appraisal.sharedAt)}
        </Text>
        {appraisal.employeeAgreement ? (
          <Badge
            tone={
              appraisal.employeeAgreement === "agree" ? "success" : "warning"
            }
            className="mt-1 self-center"
          >
            {appraisal.employeeAgreement === "agree"
              ? "You agreed"
              : "You disagreed"}
          </Badge>
        ) : null}
      </View>

      {appraisal.calibrated ? (
        <View className="rounded-xl bg-info-subtle p-3">
          <Text variant="small" className="text-info-ink">
            Your manager rated you {appraisal.managerRating}. A calibration
            panel — which compares ratings across the company so the same
            performance gets the same rating — moved it to{" "}
            {appraisal.finalRating}.
            {appraisal.calibrationReason
              ? ` Their reason: “${appraisal.calibrationReason.replace(/[.\s]+$/, "")}”.`
              : ""}
          </Text>
        </View>
      ) : null}

      {m ? (
        <Card className="gap-2">
          <Text variant="h3" className="text-text-primary">
            What your manager wrote
          </Text>
          {m.strengths ? (
            <Labelled label="Strengths" text={m.strengths} />
          ) : null}
          {m.developmentAreas ? (
            <Labelled label="To develop" text={m.developmentAreas} />
          ) : null}
          {m.overallComment ? (
            <Labelled label="Overall" text={m.overallComment} />
          ) : null}
          {m.goalComments.map((c) => (
            <Text
              key={`g-${c.goal}`}
              variant="small"
              className="text-text-body"
            >
              • {c.goal} ({c.rating}): {c.comment}
            </Text>
          ))}
          {m.competencyComments.map((c) => (
            <Text
              key={`c-${c.competency}`}
              variant="small"
              className="text-text-body"
            >
              • {c.competency} ({c.rating}): {c.comment}
            </Text>
          ))}
        </Card>
      ) : null}

      <Expandable title="What the scale means">
        {appraisal.ratingScale.map((level) => (
          <Text key={level.value} variant="small" className="text-text-body">
            <Text variant="small" className="font-semibold text-text-primary">
              {level.value}
            </Text>{" "}
            — {level.label}
            {level.description ? ` · ${level.description}` : ""}
          </Text>
        ))}
      </Expandable>

      <Expandable title="How the rating was worked out">
        <Text variant="caption" className="text-text-secondary">
          Goals count for {percent(appraisal.goalWeighting)}, competencies for{" "}
          {percent(1 - appraisal.goalWeighting)}.
        </Text>
        {/* The blend line is restated below as the sum it really is. */}
        {appraisal.breakdown
          .filter((line) => !line.label.startsWith("Blend"))
          .map((line) => (
            <View key={line.label} className="flex-row justify-between gap-3">
              <Text variant="small" className="flex-1 text-text-body">
                {line.label}
              </Text>
              <Text variant="small" tabular className="text-text-primary">
                {line.rating} × {percent(line.weight)} = {line.weighted}
              </Text>
            </View>
          ))}
        <View className="mt-1 gap-1 rounded-xl bg-bg-inset p-3">
          <Row label="Goals" value={String(appraisal.goalScore)} />
          {appraisal.goalWeighting < 1 ? (
            <Row
              label="Competencies"
              value={String(appraisal.competencyScore)}
            />
          ) : null}
          <Row
            bold
            label="Manager rating"
            value={
              appraisal.goalWeighting < 1
                ? `${appraisal.goalScore} × ${percent(appraisal.goalWeighting)} + ${appraisal.competencyScore} × ${percent(1 - appraisal.goalWeighting)} = ${appraisal.managerRating}`
                : String(appraisal.managerRating)
            }
          />
        </View>
      </Expandable>

      {appraisal.employeeComment ? (
        <Labelled label="Your comment" text={appraisal.employeeComment} />
      ) : null}
    </View>
  );
}

function Labelled({ label, text }: { label: string; text: string }) {
  return (
    <Text variant="small" className="text-text-body">
      <Text variant="small" className="font-semibold text-text-primary">
        {label}:
      </Text>{" "}
      {text}
    </Text>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text
        variant="small"
        className={bold ? "font-semibold text-text-primary" : "text-text-body"}
      >
        {label}
      </Text>
      <Text
        variant="small"
        tabular
        className={`flex-1 text-right ${bold ? "font-semibold text-text-primary" : "text-text-primary"}`}
      >
        {value}
      </Text>
    </View>
  );
}

function Expandable({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const Icon = open ? ChevronUp : ChevronDown;
  return (
    <Card className="gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between"
      >
        <Text variant="body" className="font-medium text-text-primary">
          {title}
        </Text>
        <Icon size={18} color={colors.textSecondary} />
      </Pressable>
      {open ? <View className="gap-1.5">{children}</View> : null}
    </Card>
  );
}

function RespondSheet({
  appraisal,
  onClose,
}: {
  appraisal: Appraisal;
  onClose: () => void;
}) {
  const respond = useRespondToAppraisal();
  // No answer chosen for them: agreeing must be a choice, not the default.
  const [agreement, setAgreement] = useState<"agree" | "disagree" | "">(
    appraisal.employeeAgreement ?? "",
  );
  const [comment, setComment] = useState("");
  const ready =
    !!agreement && (agreement === "agree" || comment.trim().length > 0);

  return (
    <Sheet
      visible
      onClose={onClose}
      title="Your response"
      subtitle="Your manager and HR see it. Disagreeing is recorded, not held against you — say what you see differently."
      footer={
        <Button
          label="Send response"
          size="lg"
          block
          disabled={!ready}
          loading={respond.isPending}
          onPress={() =>
            agreement &&
            respond.mutate(
              {
                id: appraisal._id,
                agreement,
                comment: comment.trim() || undefined,
              },
              {
                onSuccess: () => {
                  toast.success("Response recorded");
                  onClose();
                },
                onError: (error) =>
                  toast.error("Couldn't send it", errorMessage(error)),
              },
            )
          }
        />
      }
    >
      <View className="gap-4">
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Do you agree with this appraisal?"
          className="gap-2"
        >
          {(["agree", "disagree"] as const).map((choice) => {
            const selected = agreement === choice;
            return (
              <Pressable
                key={choice}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setAgreement(choice)}
                className={cn(
                  "min-h-[52px] flex-row items-center gap-3 rounded-xl border px-4",
                  selected ? "border-brand bg-brand-subtle" : "border-border",
                )}
              >
                <View
                  className={cn(
                    "h-5 w-5 items-center justify-center rounded-full border-2",
                    selected ? "border-brand" : "border-border-strong",
                  )}
                >
                  {selected ? (
                    <View className="h-2.5 w-2.5 rounded-full bg-brand" />
                  ) : null}
                </View>
                <Text variant="body" className="text-text-primary">
                  {choice === "agree" ? "I agree" : "I disagree"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Field
          label={
            agreement === "disagree"
              ? "What do you disagree with?"
              : "Comment (optional)"
          }
          required={agreement === "disagree"}
        >
          <Input multiline value={comment} onChangeText={setComment} />
        </Field>
        {appraisal.responses.length > 0 ? (
          <View className="gap-1">
            <Text variant="caption" className="font-medium text-text-secondary">
              Earlier responses
            </Text>
            {appraisal.responses.map((r, i) => (
              <Text key={i} variant="caption" className="text-text-secondary">
                {formatDate(r.at)} —{" "}
                {r.agreement === "agree" ? "Agreed" : "Disagreed"}
                {r.comment ? `: “${r.comment}”` : ""}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}
