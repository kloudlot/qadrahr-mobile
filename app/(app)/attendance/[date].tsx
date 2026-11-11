import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowDownLeft, ArrowUpRight, TimerReset } from "lucide-react-native";

import { ErrorView } from "@/components/state/StateViews";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/Header";
import { DetailRow, Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { errorMessage } from "@/lib/api";
import { formatDate, formatMinutes, formatTime } from "@/lib/format";
import { overtimeMinutes, usePunches, useToday } from "@/lib/queries/attendance";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * One day: what was worked, and the raw punches it was worked out from —
 * corrections included, with the times they replaced still visible.
 */
export default function AttendanceDayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const colors = useThemeColors();
  const day = useToday(date);
  const punches = usePunches(date);

  const sorted = [...(punches.data ?? [])].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  return (
    <Screen
      header={<ScreenHeader title={formatDate(date)} subtitle="Attendance" />}
      footer={
        <Button
          label="Fix a punch on this day"
          icon={TimerReset}
          size="lg"
          block
          onPress={() => router.push({ pathname: "/attendance/correct", params: { date } })}
        />
      }
    >
      <View className="gap-6 pt-2">
        {day.isLoading ? (
          <SkeletonList rows={2} />
        ) : day.error ? (
          <ErrorView message={errorMessage(day.error)} onRetry={() => void day.refetch()} />
        ) : (
          <Card>
            <View className="flex-row items-center justify-between pb-2">
              <Text variant="h1" tabular className="text-text-primary">
                {formatMinutes(day.data?.workedMinutes)}
              </Text>
              {day.data ? <StatusBadge status={day.data.status} /> : <Badge>Nothing recorded</Badge>}
            </View>
            {day.data ? (
              <>
                <DetailRow label="First in" value={formatTime(day.data.firstIn)} />
                <DetailRow label="Last out" value={formatTime(day.data.lastOut)} />
                <DetailRow label="Break" value={formatMinutes(day.data.breakMinutes)} />
                <DetailRow label="Late" value={formatMinutes(day.data.lateMinutes)} />
                <DetailRow label="Left early" value={formatMinutes(day.data.earlyOutMinutes)} />
                <DetailRow label="Overtime" value={formatMinutes(overtimeMinutes(day.data))} />
              </>
            ) : null}
          </Card>
        )}

        <Section title="Punches">
          {punches.isLoading ? (
            <SkeletonList rows={2} />
          ) : sorted.length === 0 ? (
            <Card>
              <Text variant="small" className="text-text-secondary">
                No punches were recorded on this day.
              </Text>
            </Card>
          ) : (
            <Card className="gap-4">
              {sorted.map((punch, i) => {
                const superseded = Boolean(punch.supersededByCorrection);
                const isIn = punch.direction === "in";
                return (
                  <View key={punch._id} className="flex-row gap-3">
                    <View className="items-center">
                      <View
                        className={cn(
                          "h-9 w-9 items-center justify-center rounded-full",
                          superseded ? "bg-bg-inset" : isIn ? "bg-success-subtle" : "bg-brand-subtle",
                        )}
                      >
                        {isIn ? (
                          <ArrowDownLeft size={18} color={superseded ? colors.textDisabled : colors.success} />
                        ) : (
                          <ArrowUpRight size={18} color={superseded ? colors.textDisabled : colors.brand} />
                        )}
                      </View>
                      {i < sorted.length - 1 ? <View className="mt-1 w-0.5 flex-1 bg-border" /> : null}
                    </View>
                    <View className="flex-1 gap-1 pb-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          variant="body"
                          tabular
                          className={cn("font-semibold", superseded ? "text-text-disabled line-through" : "text-text-primary")}
                        >
                          {formatTime(punch.occurredAt)}
                        </Text>
                        <Text variant="small" className="text-text-secondary">
                          {isIn ? "Clock in" : "Clock out"}
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap gap-1.5">
                        {superseded ? <Badge>Replaced</Badge> : null}
                        {punch.source === "correction" ? <Badge tone="info">Correction</Badge> : null}
                        {punch.withinGeofence === false ? <Badge tone="warning">Away from site</Badge> : null}
                      </View>
                      {punch.reason ? (
                        <Text variant="caption" className="text-text-secondary">
                          {punch.reason}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </Card>
          )}
        </Section>
      </View>
    </Screen>
  );
}
