import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { UserRound, Users } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Select } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { Divider, ListCard, ListRow, Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { errorMessage } from "@/lib/api";
import { percent, phaseLabel, preferredTeamCycle } from "@/lib/performance";
import {
  useTeamCycles,
  useTeamReports,
  type TeamReport,
} from "@/lib/queries/performance";

/** A manager's direct reports in a cycle, and where each one's review stands. */
export default function TeamPerformanceScreen() {
  const cycles = useTeamCycles();
  const [chosen, setChosen] = useState<string | null>(null);
  const list = cycles.data ?? [];
  const cycle = list.find((c) => c._id === chosen) ?? preferredTeamCycle(list);
  const reports = useTeamReports(cycle?._id);

  return (
    <Screen
      header={<ScreenHeader title="Team reviews" />}
      refreshing={reports.isRefetching}
      onRefresh={() => {
        void cycles.refetch();
        void reports.refetch();
      }}
    >
      {cycles.isLoading ? (
        <SkeletonList rows={4} />
      ) : cycles.error ? (
        <ErrorView
          message={errorMessage(cycles.error)}
          onRetry={() => void cycles.refetch()}
        />
      ) : !cycle ? (
        <EmptyView
          icon={Users}
          title="No team reviews"
          detail="This is where managers set goals and write reviews for their direct reports. You have no direct reports in an open cycle."
        />
      ) : (
        <View className="gap-4 pt-2">
          {list.length > 1 ? (
            <Select
              title="Review cycle"
              value={cycle._id}
              options={list.map((c) => ({
                value: c._id,
                label: c.name,
                detail: phaseLabel(c.phase),
              }))}
              onChange={setChosen}
            />
          ) : null}
          <Text variant="small" className="text-text-body">
            {cycle.name} is in {phaseLabel(cycle.phase)}. Agree your
            reports&rsquo; goals, read their self-reviews and feedback, and
            write their reviews.
          </Text>
          <Section title="Your reports">
            {reports.isLoading ? (
              <SkeletonList rows={3} />
            ) : reports.error ? (
              <ErrorView
                message={errorMessage(reports.error)}
                onRetry={() => void reports.refetch()}
              />
            ) : (reports.data ?? []).length === 0 ? (
              <EmptyView compact title="No reports in this cycle" />
            ) : (
              <ListCard>
                {(reports.data ?? []).map((report, i) => (
                  <View key={report.employeeId}>
                    {i > 0 ? <Divider inset={68} /> : null}
                    <ListRow
                      icon={UserRound}
                      title={report.name}
                      subtitle={summary(report)}
                      onPress={() =>
                        router.push({
                          pathname: "/performance/team/[employeeId]",
                          params: {
                            employeeId: report.employeeId,
                            cycleId: cycle._id,
                          },
                        })
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

function summary(report: TeamReport): string {
  const goals = report.goals.count
    ? `Goals ${percent(report.goals.totalWeight)}${report.goals.draft ? ` · ${report.goals.draft} draft` : " · agreed"}`
    : "Goals not set";
  const self =
    report.selfReview === "submitted" ? "self-review in" : "self-review not in";
  const mine =
    report.managerReview === "submitted"
      ? "your review submitted"
      : report.managerReview === "draft"
        ? "your review in draft"
        : "your review not started";
  return `${goals} · ${self} · ${mine}`;
}
