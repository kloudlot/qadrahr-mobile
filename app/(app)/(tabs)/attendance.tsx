import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarX2, ChevronLeft, ChevronRight, TimerReset } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HeroHeader, HeroText } from "@/components/ui/Header";
import { Divider, ListCard, Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { calendarDate, formatDay, formatMinutes, formatTime, isoDate, monthLabel, monthRange } from "@/lib/format";
import { overtimeMinutes, useAttendanceRange, type AttendanceDay } from "@/lib/queries/attendance";
import { useMyCorrections, useWithdrawCorrection, type CorrectionRequest } from "@/lib/queries/corrections";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * Attendance — the month at a glance, every day behind it, and the way to
 * fix one that is wrong.
 */
export default function AttendanceScreen() {
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const [anchor, setAnchor] = useState(() => new Date());
  const range = useMemo(() => monthRange(anchor), [anchor]);
  const days = useAttendanceRange(range.from, range.to);
  const corrections = useMyCorrections();
  const [refreshing, setRefreshing] = useState(false);

  const isCurrentMonth = anchor.getFullYear() === new Date().getFullYear() && anchor.getMonth() === new Date().getMonth();
  const shift = (delta: number) => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1));

  const rows = days.data ?? [];
  const worked = rows.reduce((sum, d) => sum + d.workedMinutes, 0);
  const daysWorked = rows.filter((d) => d.status === "present" || d.status === "partial").length;
  const late = rows.filter((d) => d.lateMinutes > 0).length;
  const overtime = rows.reduce((sum, d) => sum + overtimeMinutes(d), 0);

  // Pending first, then the latest few — enough to follow what was asked.
  const recentCorrections = [...(corrections.data ?? [])]
    .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"))
    .slice(0, 3);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["attendance"] }),
      queryClient.invalidateQueries({ queryKey: ["corrections"] }),
    ]);
    setRefreshing(false);
  };

  return (
    <Screen
      tabs
      refreshing={refreshing}
      onRefresh={() => void refresh()}
      hero={
        <HeroHeader>
          <HeroText variant="h1" className="font-bold">
            Attendance
          </HeroText>
          <HeroText variant="small" muted>
            Your days, hours and punches
          </HeroText>
        </HeroHeader>
      }
    >
      <View className="gap-6">
        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <IconButton icon={ChevronLeft} label="Previous month" onPress={() => shift(-1)} />
            <Text variant="h3" className="text-text-primary">
              {monthLabel(anchor)}
            </Text>
            <IconButton
              icon={ChevronRight}
              label="Next month"
              // Nothing is recorded in the future.
              onPress={() => (isCurrentMonth ? undefined : shift(1))}
              className={isCurrentMonth ? "opacity-30" : undefined}
            />
          </View>
          <View className="flex-row">
            <Figure label="Days worked" value={String(daysWorked)} />
            <Figure label="Hours" value={formatMinutes(worked)} />
            <Figure label="Late" value={String(late)} />
            <Figure label="Overtime" value={formatMinutes(overtime)} />
          </View>
        </Card>

        <Section title="Corrections" action="Fix a punch" onAction={() => router.push("/attendance/correct")}>
          {recentCorrections.length === 0 ? (
            <Card className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-warning-subtle">
                <TimerReset size={20} color={colors.warning} />
              </View>
              <Text variant="small" className="flex-1 text-text-secondary">
                Forgot to clock out, or a time is wrong? Ask for it to be fixed — your manager approves it first.
              </Text>
            </Card>
          ) : (
            <ListCard>
              {recentCorrections.map((c, i) => (
                <View key={c._id}>
                  {i > 0 ? <Divider /> : null}
                  <CorrectionRow correction={c} />
                </View>
              ))}
            </ListCard>
          )}
        </Section>

        <Section title="Days">
          {days.isLoading ? (
            <SkeletonList rows={5} />
          ) : days.error ? (
            <ErrorView message={errorMessage(days.error)} onRetry={() => void days.refetch()} />
          ) : rows.length === 0 ? (
            <Card>
              <EmptyView
                compact
                icon={CalendarX2}
                title="Nothing recorded"
                detail={isCurrentMonth ? "Days appear here once you clock in." : "No attendance was recorded this month."}
              />
            </Card>
          ) : (
            <ListCard>
              {rows.map((day, i) => (
                <View key={day._id}>
                  {i > 0 ? <Divider /> : null}
                  <DayRow day={day} />
                </View>
              ))}
            </ListCard>
          )}
        </Section>
      </View>
    </Screen>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center gap-0.5">
      <Text variant="h3" tabular className="text-text-primary">
        {value}
      </Text>
      <Text variant="caption" className="text-text-secondary">
        {label}
      </Text>
    </View>
  );
}

function DayRow({ day }: { day: AttendanceDay }) {
  const date = calendarDate(day.businessDate);
  // An open session today is someone still at work; on a past day it is a
  // clock-out that never happened.
  const missingOut = day.unpairedPunches > 0 && day.businessDate < isoDate(new Date());

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatDay(day.businessDate)}, ${formatMinutes(day.workedMinutes)}`}
      onPress={() => router.push({ pathname: "/attendance/[date]", params: { date: day.businessDate } })}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-bg-inset"
    >
      <View className="w-12 items-center rounded-xl bg-bg-inset py-1.5">
        <Text variant="caption" className="text-text-secondary">
          {date.toLocaleDateString([], { weekday: "short" })}
        </Text>
        <Text variant="h3" tabular className="text-text-primary">
          {date.getDate()}
        </Text>
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text variant="small" tabular className="font-medium text-text-primary">
          {day.firstIn ? `${formatTime(day.firstIn)} – ${day.lastOut ? formatTime(day.lastOut) : "…"}` : "No punches"}
        </Text>
        <View className="flex-row flex-wrap gap-1.5">
          <StatusBadge status={day.status} />
          {day.lateMinutes > 0 ? <Badge tone="warning">{`Late ${formatMinutes(day.lateMinutes)}`}</Badge> : null}
          {missingOut ? <Badge tone="danger">Missing clock-out</Badge> : null}
          {day.hasCorrections ? <Badge tone="info">Corrected</Badge> : null}
        </View>
      </View>
      <Text variant="body" tabular className="font-semibold text-text-primary">
        {formatMinutes(day.workedMinutes)}
      </Text>
    </Pressable>
  );
}

function CorrectionRow({ correction }: { correction: CorrectionRequest }) {
  const withdraw = useWithdrawCorrection();
  const what =
    correction.kind === "missing"
      ? `Add a clock-${correction.direction ?? "in"}`
      : `${formatTime(correction.originalOccurredAt)} → ${formatTime(correction.occurredAt)}`;

  return (
    <View className="gap-2 px-4 py-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text variant="small" className="font-medium text-text-primary">
            {what}
          </Text>
          <Text variant="caption" className="text-text-secondary">
            {formatDay(isoDate(new Date(correction.occurredAt)))} · {correction.reason}
          </Text>
        </View>
        <StatusBadge status={correction.status} />
      </View>
      {correction.failureReason ? (
        <Text variant="caption" className="text-danger">
          Approved, but could not be applied: {correction.failureReason}
        </Text>
      ) : null}
      {correction.status === "pending" ? (
        <Button
          label="Withdraw"
          variant="ghost"
          className="self-start px-0"
          loading={withdraw.isPending}
          onPress={() =>
            withdraw.mutate(correction._id, {
              onSuccess: () => toast.success("Request withdrawn"),
              onError: (error) => toast.error("Couldn't withdraw it", errorMessage(error)),
            })
          }
        />
      ) : null}
    </View>
  );
}
