import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";

import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { Card } from "./Card";
import { Text } from "./Text";

/** A titled group of content, with an optional action on the right ("See all"). */
export function Section({
  title,
  action,
  onAction,
  children,
  className,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("gap-3", className)}>
      <View className="flex-row items-center justify-between px-1">
        <Text variant="h3" className="text-text-primary">
          {title}
        </Text>
        {action && onAction ? (
          <Pressable accessibilityRole="button" onPress={onAction} hitSlop={10}>
            <Text variant="small" className="font-semibold text-brand">
              {action}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** A card of rows with hairlines between them. */
export function ListCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card padded={false} className={cn("overflow-hidden", className)}>
      {children}
    </Card>
  );
}

export function Divider({ inset = 16 }: { inset?: number }) {
  return <View className="h-hairline bg-border" style={{ marginLeft: inset }} />;
}

/**
 * One row: an icon tile, a title and a line under it, and whatever belongs
 * on the right — a value, a badge, a count, or just a chevron.
 */
export function ListRow({
  title,
  subtitle,
  icon: Icon,
  iconTone = "brand",
  right,
  count,
  onPress,
  chevron,
  destructive = false,
  className,
}: {
  title: string;
  subtitle?: string | null;
  icon?: LucideIcon;
  iconTone?: "brand" | "success" | "warning" | "danger" | "info" | "neutral";
  right?: ReactNode;
  /** A number bubble — "3 waiting". Hidden at zero. */
  count?: number;
  onPress?: () => void;
  /** Defaults to on for a pressable row. */
  chevron?: boolean;
  destructive?: boolean;
  className?: string;
}) {
  const colors = useThemeColors();
  const tint = destructive
    ? { box: "bg-danger-subtle", color: colors.danger }
    : {
        brand: { box: "bg-brand-subtle", color: colors.brand },
        success: { box: "bg-success-subtle", color: colors.success },
        warning: { box: "bg-warning-subtle", color: colors.warning },
        danger: { box: "bg-danger-subtle", color: colors.danger },
        info: { box: "bg-info-subtle", color: colors.info },
        neutral: { box: "bg-neutral-subtle", color: colors.neutral },
      }[iconTone];
  const showChevron = chevron ?? Boolean(onPress);

  const body = (
    <View className={cn("min-h-[60px] flex-row items-center gap-3 px-4 py-3", className)}>
      {Icon ? (
        <View className={cn("h-10 w-10 items-center justify-center rounded-xl", tint.box)}>
          <Icon size={20} color={tint.color} />
        </View>
      ) : null}
      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          variant="body"
          numberOfLines={1}
          className={cn("font-medium", destructive ? "text-danger" : "text-text-primary")}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" numberOfLines={2} className="text-text-secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {count ? (
        <View className="min-w-[22px] items-center rounded-pill bg-brand px-1.5 py-0.5">
          <Text variant="caption" tabular className="font-semibold text-brand-ink">
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      ) : null}
      {showChevron ? <ChevronRight size={18} color={colors.textDisabled} /> : null}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} className="active:bg-bg-inset">
      {body}
    </Pressable>
  );
}

/** Label and value on one line, for detail screens. */
export function DetailRow({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <View className={cn("flex-row items-start justify-between gap-4 py-2.5", className)}>
      <Text variant="small" className="text-text-secondary">
        {label}
      </Text>
      {typeof value === "string" || typeof value === "number" ? (
        <Text variant="small" tabular className="flex-1 text-right font-medium text-text-primary">
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}
