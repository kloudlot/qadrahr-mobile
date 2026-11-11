import { Pressable, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { useThemeColors, type ThemeColors } from "@/lib/theme/ThemeProvider";

export type ActionTone = "brand" | "info" | "success" | "warning" | "neutral";

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  tone: ActionTone;
  onPress: () => void;
  /** A count bubble — approvals waiting. */
  count?: number;
}

function tint(tone: ActionTone, colors: ThemeColors) {
  return {
    brand: { box: "bg-brand-subtle", color: colors.brand },
    info: { box: "bg-info-subtle", color: colors.info },
    success: { box: "bg-success-subtle", color: colors.success },
    warning: { box: "bg-warning-subtle", color: colors.warning },
    neutral: { box: "bg-neutral-subtle", color: colors.neutral },
  }[tone];
}

/** The things an employee comes to do, three to a row. */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const colors = useThemeColors();

  return (
    <Card className="flex-row flex-wrap px-2 py-3">
      {actions.map((action) => {
        const t = tint(action.tone, colors);
        const Icon = action.icon;
        return (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={action.count ? `${action.label}, ${action.count} waiting` : action.label}
            onPress={action.onPress}
            className="w-1/3 items-center gap-2 rounded-2xl px-1 py-3 active:bg-bg-inset"
          >
            <View className={cn("h-12 w-12 items-center justify-center rounded-2xl", t.box)}>
              <Icon size={22} color={t.color} />
              {action.count ? (
                <View className="absolute -right-1.5 -top-1.5 min-w-[20px] items-center rounded-pill border-2 border-bg-card bg-danger px-1">
                  <Text variant="micro" tabular className="normal-case tracking-normal text-white">
                    {action.count > 9 ? "9+" : action.count}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="caption" numberOfLines={1} className="text-center font-medium text-text-primary">
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </Card>
  );
}
