import { useState } from "react";
import { View } from "react-native";
import { CheckCircle2, ScrollText } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { DetailRow, Divider, ListCard, ListRow } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { Sheet } from "@/components/ui/Sheet";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useAcknowledgePolicy, useOutstandingPolicies, type Policy } from "@/lib/queries/workplace";

/**
 * Policies I have to read and accept. Acceptance is recorded against the
 * version, so a revised policy comes back here even for someone who
 * accepted the last one.
 */
export default function PoliciesScreen() {
  const policies = useOutstandingPolicies();
  const [reading, setReading] = useState<Policy | null>(null);

  const rows = policies.data ?? [];

  return (
    <>
      <Screen
        header={<ScreenHeader title="Policies" subtitle="To read and accept" />}
        refreshing={policies.isRefetching}
        onRefresh={() => void policies.refetch()}
      >
        <View className="pt-2">
          {policies.isLoading ? (
            <SkeletonList rows={3} />
          ) : policies.error ? (
            <ErrorView message={errorMessage(policies.error)} onRetry={() => void policies.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyView icon={CheckCircle2} title="You're all caught up" detail="Every policy assigned to you has been accepted." />
          ) : (
            <ListCard>
              {rows.map((policy, i) => (
                <View key={policy._id}>
                  {i > 0 ? <Divider inset={68} /> : null}
                  <ListRow
                    icon={ScrollText}
                    iconTone="warning"
                    title={policy.title}
                    subtitle={`Version ${policy.version}${policy.effectiveFrom ? ` · from ${formatDate(policy.effectiveFrom)}` : ""}`}
                    right={<Badge tone="warning">To accept</Badge>}
                    onPress={() => setReading(policy)}
                  />
                </View>
              ))}
            </ListCard>
          )}
        </View>
      </Screen>

      <PolicySheet policy={reading} onClose={() => setReading(null)} />
    </>
  );
}

function PolicySheet({ policy, onClose }: { policy: Policy | null; onClose: () => void }) {
  const acknowledge = useAcknowledgePolicy();

  return (
    <Sheet
      visible={Boolean(policy)}
      onClose={onClose}
      dismissable={!acknowledge.isPending}
      title={policy?.title}
      subtitle={policy ? `${policy.code} · version ${policy.version}` : undefined}
      footer={
        policy ? (
          <Button
            label="I have read and accept it"
            icon={CheckCircle2}
            size="lg"
            block
            haptic
            loading={acknowledge.isPending}
            onPress={() =>
              acknowledge.mutate(policy._id, {
                onSuccess: () => {
                  toast.success("Policy accepted", `${policy.title}, version ${policy.version}.`);
                  onClose();
                },
                onError: (error) => toast.error("Couldn't record that", errorMessage(error)),
              })
            }
          />
        ) : null
      }
    >
      {policy ? (
        <View className="gap-4">
          {policy.effectiveFrom ? <DetailRow label="In force from" value={formatDate(policy.effectiveFrom)} /> : null}
          <Text variant="body" className="text-text-body">
            {policy.summary?.trim() || "HR has not added a summary. Ask them for the full policy before you accept it."}
          </Text>
          <Text variant="caption" className="text-text-secondary">
            Accepting records the date and this version against your name.
          </Text>
        </View>
      ) : null}
    </Sheet>
  );
}
