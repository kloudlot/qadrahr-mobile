import { Pressable, View } from "react-native";
import { Plane } from "lucide-react-native";

import { StatusBadge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import type { LeaveRequest } from "@/lib/queries/leave";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { formatDays } from "./BalanceBar";

/** One leave request in the list. Tapping it opens the details. */
export function RequestRow({
  request,
  typeName,
  onPress,
}: {
  request: LeaveRequest;
  typeName: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${typeName}, ${formatRange(request.startDate, request.endDate)}, ${request.status}`}
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-bg-inset"
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-info-subtle">
        <Plane size={20} color={colors.info} />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="body" numberOfLines={1} className="font-medium text-text-primary">
          {typeName}
        </Text>
        <Text variant="caption" tabular className="text-text-secondary">
          {formatRange(request.startDate, request.endDate)} · {formatDays(request.days)}
        </Text>
      </View>
      <StatusBadge status={request.status} />
    </Pressable>
  );
}

export function formatRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} – ${endDate}`;
  }

  const day = (date: Date) => date.toLocaleDateString([], { day: "numeric" });
  const dayMonth = (date: Date) => date.toLocaleDateString([], { day: "numeric", month: "short" });

  if (startDate === endDate) return dayMonth(start);
  if (start.getMonth() === end.getMonth()) return `${day(start)}–${dayMonth(end)}`;
  return `${dayMonth(start)} – ${dayMonth(end)}`;
}
