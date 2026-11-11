import { ActivityIndicator, Pressable, View, type PressableProps } from "react-native";
import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";

import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger";
type Size = "md" | "lg";

const CONTAINER: Record<Variant, string> = {
  primary: "bg-brand active:bg-brand-active",
  secondary: "bg-bg-card border border-border active:bg-bg-inset",
  soft: "bg-brand-subtle active:opacity-80",
  ghost: "bg-transparent active:bg-bg-inset",
  danger: "bg-danger active:opacity-90",
};

const LABEL: Record<Variant, string> = {
  primary: "text-brand-ink",
  secondary: "text-text-primary",
  soft: "text-brand",
  ghost: "text-brand",
  danger: "text-white",
};

const SIZE: Record<Size, string> = {
  md: "min-h-touch rounded-xl px-4",
  lg: "min-h-[52px] rounded-2xl px-5",
};

export interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  size?: Size;
  /** A leading icon. */
  icon?: LucideIcon;
  loading?: boolean;
  /** Fills its container. The default for anything that is the screen's action. */
  block?: boolean;
  /** A light tap on press. On for the actions that commit something. */
  haptic?: boolean;
  className?: string;
}

/**
 * The button.
 *
 * `min-h-touch` is 44px and is not negotiable — it is the minimum target
 * this app ships, and the clock button in particular is pressed with a thumb,
 * outdoors, in a hurry.
 *
 * A loading button stays the same size and swaps its label for a spinner
 * rather than shrinking, because a control that resizes under a thumb is a
 * control that gets mis-tapped.
 */
export function Button({
  label,
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  block = false,
  haptic = false,
  disabled,
  className,
  onPress,
  ...props
}: ButtonProps) {
  const colors = useThemeColors();
  const inactive = disabled || loading;
  const tint =
    variant === "primary"
      ? colors.onBrand
      : variant === "danger"
        ? "#FFFFFF"
        : variant === "secondary"
          ? colors.textPrimary
          : colors.brand;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inactive), busy: loading }}
      accessibilityLabel={label}
      disabled={inactive}
      onPress={(event) => {
        if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(event);
      }}
      className={cn(
        "flex-row items-center justify-center",
        SIZE[size],
        CONTAINER[variant],
        block && "w-full",
        inactive && "opacity-50",
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={tint} />
      ) : (
        <View className="flex-row items-center gap-2">
          {Icon ? <Icon size={18} color={tint} strokeWidth={2.2} /> : null}
          <Text variant="body" className={cn("font-semibold", LABEL[variant])}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** A round icon-only button — headers, sheets, the bell. */
export function IconButton({
  icon: Icon,
  label,
  onPress,
  tone = "default",
  badge = false,
  className,
}: {
  icon: LucideIcon;
  /** Read by screen readers; there is no visible text. */
  label: string;
  onPress: () => void;
  /** `onBrand` sits on the hero header. */
  tone?: "default" | "onBrand";
  /** A small dot, for "something new here". */
  badge?: boolean;
  className?: string;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      className={cn(
        "h-11 w-11 items-center justify-center rounded-full",
        tone === "onBrand" ? "bg-white/15 active:bg-white/25" : "bg-bg-inset active:opacity-80",
        className,
      )}
    >
      <Icon size={20} color={tone === "onBrand" ? colors.onBrand : colors.textPrimary} />
      {badge ? (
        <View
          className={cn(
            "absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-danger",
            tone === "onBrand" ? "border-2 border-brand" : "border-2 border-bg-inset",
          )}
        />
      ) : null}
    </Pressable>
  );
}
