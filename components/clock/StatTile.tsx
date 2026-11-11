import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * A small figure with a label — leave left, next holiday.
 *
 * Renders nothing when it has no value. These are glanceable context, not
 * the reason the screen exists — an empty slot is quieter and more honest
 * than "—", which invites the reader to wonder whether their leave balance
 * is genuinely zero.
 */
export function StatTile({
  label,
  value,
  caption,
  icon: Icon,
  tone = "brand",
  onPress,
}: {
  label: string;
  value: string | null | undefined;
  caption?: string | null;
  icon?: LucideIcon;
  tone?: "brand" | "info" | "success" | "warning";
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  if (!value) return null;

  const tint = {
    brand: { box: "bg-brand-subtle", color: colors.brand },
    info: { box: "bg-info-subtle", color: colors.info },
    success: { box: "bg-success-subtle", color: colors.success },
    warning: { box: "bg-warning-subtle", color: colors.warning },
  }[tone];

  return (
    <Card className="flex-1 gap-3" onPress={onPress} accessibilityLabel={`${label}: ${value}`}>
      {Icon ? (
        <View className={cn("h-9 w-9 items-center justify-center rounded-xl", tint.box)}>
          <Icon size={18} color={tint.color} />
        </View>
      ) : null}
      <View className="gap-0.5">
        <Text variant="caption" className="text-text-secondary">
          {label}
        </Text>
        <Text variant="h2" tabular numberOfLines={1} className="text-text-primary">
          {value}
        </Text>
        {caption ? (
          <Text variant="caption" className="text-text-secondary" numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
