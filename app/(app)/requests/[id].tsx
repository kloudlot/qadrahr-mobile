import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Check, CircleDot, CornerUpLeft, Undo2 } from "lucide-react-native";

import { detailFor, SubjectIcon, whereIsIt } from "@/components/requests/describe";
import { ErrorView } from "@/components/state/StateViews";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/Header";
import { Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDate, formatTime } from "@/lib/format";
import { describeSubject } from "@/lib/queries/approvals";
import { useRequest, useRequestAction, useRequestDecisions, type Decision } from "@/lib/queries/requests";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

const DECISION_LABEL: Record<Decision["decision"], string> = {
  approved: "Approved",
  rejected: "Not approved",
  returned: "Sent back for changes",
  cancelled: "Withdrawn",
  delegated: "Delegated",
};

/** One request: where it is in its chain, who decided what, and what I can still do. */
export default function RequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const request = useRequest(id);
  const decisions = useRequestDecisions(id);
  const action = useRequestAction();

  const item = request.data;
  const canWithdraw = item && ["pending", "returned", "blocked"].includes(item.state);
  const canResubmit = item?.state === "returned";

  const run = (kind: "cancel" | "resubmit") =>
    action.mutate(
      { id, action: kind },
      {
        onSuccess: () => {
          toast.success(kind === "cancel" ? "Request withdrawn" : "Resubmitted", kind === "resubmit" ? "It starts again from the first step." : undefined);
          if (kind === "cancel") router.back();
        },
        onError: (error) => toast.error("That didn't work", errorMessage(error)),
      },
    );

  const steps = [...(item?.resolvedSteps ?? [])].sort((a, b) => a.order - b.order);

  return (
    <Screen
      header={<ScreenHeader title={item ? describeSubject(item.subjectType) : "Request"} />}
      footer={
        canWithdraw ? (
          <View className="gap-2">
            {canResubmit ? (
              <Button label="Resubmit" icon={CornerUpLeft} size="lg" block loading={action.isPending} onPress={() => run("resubmit")} />
            ) : null}
            <Button label="Withdraw" icon={Undo2} variant="secondary" size="lg" block loading={action.isPending} onPress={() => run("cancel")} />
          </View>
        ) : null
      }
    >
      {request.isLoading ? (
        <SkeletonList rows={3} />
      ) : request.error || !item ? (
        <ErrorView message={errorMessage(request.error)} onRetry={() => void request.refetch()} />
      ) : (
        <View className="gap-6 pt-2">
          <Card className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-subtle">
                <SubjectIcon subjectType={item.subjectType} size={24} color={colors.brand} />
              </View>
              <View className="flex-1">
                <Text variant="h3" className="text-text-primary">
                  {whereIsIt(item)}
                </Text>
                <Text variant="caption" className="text-text-secondary">
                  Raised {formatDate(item.createdAt)}
                  {detailFor(item) ? ` · ${detailFor(item)}` : ""}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <StatusBadge status={item.state} />
              {item.overridden ? <Badge tone="info">Decided by HR</Badge> : null}
            </View>
          </Card>

          {steps.length > 0 ? (
            <Section title="Approval steps">
              <Card className="gap-3">
                {steps.map((step) => {
                  const done = step.order < item.currentStepOrder || item.state === "approved";
                  const here = step.order === item.currentStepOrder && ["pending", "blocked", "returned"].includes(item.state);
                  return (
                    <View key={step.order} className="flex-row items-center gap-3">
                      <View
                        className={cn(
                          "h-7 w-7 items-center justify-center rounded-full",
                          done ? "bg-success-subtle" : here ? "bg-brand-subtle" : "bg-bg-inset",
                        )}
                      >
                        {done ? (
                          <Check size={15} color={colors.success} strokeWidth={3} />
                        ) : (
                          <CircleDot size={15} color={here ? colors.brand : colors.textDisabled} />
                        )}
                      </View>
                      <Text
                        variant="body"
                        className={cn(here ? "font-semibold text-text-primary" : done ? "text-text-body" : "text-text-disabled")}
                      >
                        {step.name}
                      </Text>
                    </View>
                  );
                })}
              </Card>
            </Section>
          ) : null}

          <Section title="History">
            {decisions.isLoading ? (
              <SkeletonList rows={2} />
            ) : (decisions.data ?? []).length === 0 ? (
              <Card>
                <Text variant="small" className="text-text-secondary">
                  No decisions yet.
                </Text>
              </Card>
            ) : (
              <Card className="gap-4">
                {(decisions.data ?? []).map((d) => (
                  <View key={d._id} className="gap-1 border-l-2 border-border pl-3">
                    <Text variant="small" className="text-text-primary">
                      <Text variant="small" className="font-semibold text-text-primary">
                        {DECISION_LABEL[d.decision]}
                      </Text>
                      {d.actorName ? ` by ${d.actorName}` : ""}
                      {d.onBehalfOfName ? ` for ${d.onBehalfOfName}` : ""}
                    </Text>
                    <Text variant="caption" className="text-text-secondary">
                      {formatDate(d.createdAt)} · {formatTime(d.createdAt)}
                      {d.stepName !== "withdrawal" ? ` · ${d.stepName}` : ""}
                    </Text>
                    {d.comment ? (
                      <Text variant="small" className="rounded-xl bg-bg-inset px-3 py-2 text-text-body">
                        {d.comment}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </Card>
            )}
          </Section>
        </View>
      )}
    </Screen>
  );
}
