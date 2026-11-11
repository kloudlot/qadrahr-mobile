import { View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import type { AttendanceDay } from "@/lib/queries/attendance";
import { addDays } from "@/lib/queries/attendance";

const LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * This week at a glance.
 *
 * Seven columns always, built from the Monday rather than from whatever
 * the server returned — a week with three recorded days should show four
 * empty ones, not shrink. An absent day is genuinely unknown (the future,
 * or a day never aggregated), which is a different thing from a zero.
 */
export function WeekStrip({
  monday,
  days,
  today,
}: {
  monday: string;
  days: AttendanceDay[] | undefined;
  today: string;
}) {
  const byDate = new Map((days ?? []).map((day) => [day.businessDate, day]));

  return (
    <Card className="gap-3">
      <View className="flex-row justify-between">
        {LABELS.map((label, index) => {
          const date = addDays(monday, index);
          const day = byDate.get(date);
          const isToday = date === today;

          return (
            <View
              key={date}
              className={`items-center gap-1.5 rounded-2xl py-1.5 ${isToday ? "bg-brand-subtle" : ""}`}
              style={{ width: 42 }}
            >
              <Text
                variant="caption"
                className={isToday ? "font-semibold text-brand" : "text-text-secondary"}
              >
                {label}
              </Text>
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${background(day)}`}
              >
                <Text variant="caption" tabular className={foreground(day)}>
                  {summarise(day)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

/** Hours, or a word when hours would be misleading. */
function summarise(day: AttendanceDay | undefined): string {
  if (!day) return "–";

  switch (day.status) {
    case "on_leave":
      return "Lv";
    case "holiday":
      return "Ho";
    case "rest_day":
      return "–";
    case "absent":
      return "0";
    default: {
      // Hours to one decimal: "8.2" fits a 40px column where "8h 12m"
      // does not, and the strip is for scanning rather than for payroll.
      const hours = day.workedMinutes / 60;
      return hours >= 10 ? String(Math.round(hours)) : hours.toFixed(1);
    }
  }
}

function background(day: AttendanceDay | undefined): string {
  if (!day) return "bg-bg-inset";
  if (day.exceptions.length > 0) return "bg-warning-subtle";

  switch (day.status) {
    case "present":
      return "bg-success-subtle";
    case "partial":
      return "bg-warning-subtle";
    case "absent":
      return "bg-danger-subtle";
    case "on_leave":
    case "holiday":
      return "bg-info-subtle";
    default:
      return "bg-bg-inset";
  }
}

function foreground(day: AttendanceDay | undefined): string {
  if (!day) return "text-text-disabled";
  if (day.exceptions.length > 0) return "text-warning-ink";

  switch (day.status) {
    case "present":
      return "text-success-ink";
    case "partial":
      return "text-warning-ink";
    case "absent":
      return "text-danger-ink";
    case "on_leave":
    case "holiday":
      return "text-info-ink";
    default:
      return "text-text-secondary";
  }
}
