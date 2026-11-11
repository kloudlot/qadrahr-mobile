import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ReviewForm } from "@/components/performance/ReviewForm";
import { ErrorView } from "@/components/state/StateViews";
import { ScreenHeader } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { phaseLabel } from "@/lib/performance";
import {
  useSaveSelfReview,
  useSelfReviewForm,
} from "@/lib/queries/performance";

/** The employee's self-review for one cycle: their goals and competencies, rated, in their words. */
export default function SelfReviewScreen() {
  const { cycleId } = useLocalSearchParams<{ cycleId: string }>();
  const form = useSelfReviewForm(cycleId);
  const save = useSaveSelfReview(cycleId);
  const data = form.data;
  const open = data?.cycle.phase === "self_review";

  return (
    <Screen
      header={<ScreenHeader title="Self-review" subtitle={data?.cycle.name} />}
    >
      {form.isLoading ? (
        <SkeletonList rows={4} />
      ) : form.error || !data ? (
        <ErrorView
          message={errorMessage(form.error)}
          onRetry={() => void form.refetch()}
        />
      ) : (
        <View className="gap-4 pt-2">
          {!open && !data.review ? (
            <View className="rounded-xl bg-warning-subtle p-3">
              <Text variant="small" className="text-warning-ink">
                Self-reviews are written during the self-review phase.{" "}
                {data.cycle.name} is in {phaseLabel(data.cycle.phase)}.
              </Text>
            </View>
          ) : null}
          <ReviewForm
            key={`${cycleId}-${data.review?.status ?? "new"}`}
            goals={data.goals}
            competencies={data.competencies}
            scale={data.cycle.ratingScale}
            review={data.review}
            readOnly={!open}
            saving={save.isPending}
            submitWarning="Once submitted, your self-review can no longer be changed. Your manager reads it before writing theirs."
            onSave={(body) =>
              save.mutate(body, {
                onSuccess: () => {
                  toast.success(
                    body.submit ? "Self-review submitted" : "Draft saved",
                  );
                  if (body.submit) router.back();
                },
                onError: (error) =>
                  toast.error("Couldn't save it", errorMessage(error)),
              })
            }
          />
        </View>
      )}
    </Screen>
  );
}
