import { useState } from "react";
import { Alert, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ErrorView } from "@/components/state/StateViews";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import {
  useFeedbackTargets,
  useMyCycles,
  useMyFeedback,
  useSaveFeedback,
} from "@/lib/queries/performance";

/**
 * Peer feedback for a colleague, or upward feedback for one's manager. It
 * informs their manager and is never scored, and the giver's name is not
 * shown to them or to their manager.
 */
export default function FeedbackScreen() {
  const params = useLocalSearchParams<{
    cycleId: string;
    employeeId?: string;
  }>();
  const targets = useFeedbackTargets();
  const cycles = useMyCycles();
  const [target, setTarget] = useState<string | null>(
    params.employeeId ?? null,
  );

  const cycle = cycles.data?.find((c) => c._id === params.cycleId);
  const open =
    !!cycle && ["self_review", "manager_review"].includes(cycle.phase);
  const manager = targets.data?.manager ?? null;
  const options = [
    ...(manager
      ? [
          {
            value: manager.employeeId,
            label: manager.name,
            detail: "Your manager",
          },
        ]
      : []),
    ...(targets.data?.peers ?? []).map((peer) => ({
      value: peer.employeeId,
      label: peer.name,
    })),
  ];

  return (
    <Screen
      header={<ScreenHeader title="Give feedback" subtitle={cycle?.name} />}
    >
      {targets.isLoading ? (
        <SkeletonList rows={3} />
      ) : targets.error ? (
        <ErrorView
          message={errorMessage(targets.error)}
          onRetry={() => void targets.refetch()}
        />
      ) : (
        <View className="gap-4 pt-2">
          <Text variant="small" className="text-text-body">
            Feedback informs their manager and is never scored. Your name is not
            shown to them or their manager.
          </Text>
          {!open ? (
            <View className="rounded-xl bg-warning-subtle p-3">
              <Text variant="small" className="text-warning-ink">
                Feedback is gathered during self-review and manager review.
              </Text>
            </View>
          ) : null}
          <Field label="Who is it for?">
            <Select
              title="Feedback for"
              placeholder="Choose a colleague…"
              value={target}
              options={options}
              onChange={setTarget}
            />
          </Field>
          {target ? (
            <FeedbackForm
              key={target}
              cycleId={params.cycleId}
              employeeId={target}
              reviewType={manager?.employeeId === target ? "upward" : "peer"}
              disabled={!open}
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function FeedbackForm({
  cycleId,
  employeeId,
  reviewType,
  disabled,
}: {
  cycleId: string;
  employeeId: string;
  reviewType: "peer" | "upward";
  disabled: boolean;
}) {
  const existing = useMyFeedback(cycleId, employeeId);
  const save = useSaveFeedback(cycleId);
  const [text, setText] = useState<{
    strengths: string;
    developmentAreas: string;
    overallComment: string;
  } | null>(null);

  if (existing.isLoading) return <SkeletonList rows={2} />;
  const review = existing.data;
  const values = text ?? {
    strengths: review?.strengths ?? "",
    developmentAreas: review?.developmentAreas ?? "",
    overallComment: review?.overallComment ?? "",
  };
  const sent = review?.status === "submitted";
  const locked = sent || disabled;

  const send = (submit: boolean) =>
    save.mutate(
      {
        employeeId,
        reviewType,
        strengths: values.strengths.trim() || undefined,
        developmentAreas: values.developmentAreas.trim() || undefined,
        overallComment: values.overallComment.trim() || undefined,
        submit,
      },
      {
        onSuccess: () =>
          toast.success(submit ? "Feedback sent" : "Draft saved"),
        onError: (error) =>
          toast.error("Couldn't save it", errorMessage(error)),
      },
    );

  return (
    <Card className="gap-4">
      {sent ? (
        <View className="rounded-xl bg-success-subtle p-3">
          <Text variant="small" className="text-success-ink">
            Sent — it can no longer be changed.
          </Text>
        </View>
      ) : null}
      {(
        [
          ["strengths", "What do they do well?"],
          ["developmentAreas", "What could they do differently?"],
          ["overallComment", "Anything else"],
        ] as const
      ).map(([field, label]) => (
        <Field key={field} label={label}>
          <Input
            multiline
            editable={!locked}
            value={values[field]}
            onChangeText={(value) => setText({ ...values, [field]: value })}
          />
        </Field>
      ))}
      {!locked ? (
        <View className="gap-2">
          <Button
            label="Send feedback"
            size="lg"
            block
            loading={save.isPending}
            onPress={() =>
              Alert.alert(
                "Send feedback?",
                "Once sent it can no longer be changed. Your name is not shown with it.",
                [
                  { text: "Not yet", style: "cancel" },
                  { text: "Send", onPress: () => send(true) },
                ],
              )
            }
          />
          <Button
            label="Save draft"
            variant="secondary"
            size="lg"
            block
            loading={save.isPending}
            onPress={() => send(false)}
          />
        </View>
      ) : null}
    </Card>
  );
}
