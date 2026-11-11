import { useCallback, type ReactNode } from "react";
import { View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { IconButton } from "./Button";
import { Text } from "./Text";

/**
 * The brand header at the top of a tab screen.
 *
 * Curved at the bottom, with the screen's first card overlapping the curve
 * (`<Screen hero>` does the overlap). Draws under the status bar, so it
 * owns the top inset and flips the status bar to suit the brand fill —
 * only while its screen is focused, because tab screens stay mounted.
 */
export function HeroHeader({
  children,
  className,
  bottom = 64,
}: {
  children: ReactNode;
  className?: string;
  /** Room under the content for the overlapping card. */
  bottom?: number;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const onBrandIsLight = colors.onBrand.toLowerCase() === "#ffffff";

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(onBrandIsLight ? "light" : "dark");
      return () => setStatusBarStyle(colors.scheme === "dark" ? "light" : "dark");
    }, [onBrandIsLight, colors.scheme]),
  );

  return (
    <View
      className={cn("overflow-hidden rounded-b-[32px] bg-brand px-screen-x", className)}
      style={{ paddingTop: insets.top + 12, paddingBottom: bottom }}
    >
      {/* Two soft rings, so a flat brand fill has some depth. */}
      <View className="absolute -right-16 -top-10 h-56 w-56 rounded-full bg-white/10" pointerEvents="none" />
      <View className="absolute -left-10 bottom-[-72px] h-40 w-40 rounded-full bg-white/5" pointerEvents="none" />
      {children}
    </View>
  );
}

/** Text on the hero, in the colour that reads on the tenant's brand. */
export function HeroText({
  children,
  variant = "body",
  muted = false,
  className,
}: {
  children: ReactNode;
  variant?: "display" | "h1" | "h2" | "body" | "small" | "caption" | "micro";
  muted?: boolean;
  className?: string;
}) {
  return (
    <Text variant={variant} className={cn("text-brand-ink", muted && "opacity-80", className)}>
      {children}
    </Text>
  );
}

/**
 * The header of a pushed screen: back, a title, and room for an action.
 */
export function ScreenHeader({
  title,
  subtitle,
  back = true,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-row items-center gap-3 bg-bg-page px-screen-x pb-3" style={{ paddingTop: insets.top + 8 }}>
      {back ? (
        <IconButton
          icon={ChevronLeft}
          label="Back"
          onPress={() => (onBack ? onBack() : router.canGoBack() ? router.back() : router.replace("/"))}
        />
      ) : null}
      <View className="min-w-0 flex-1">
        <Text variant="h2" numberOfLines={1} className="text-text-primary">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" numberOfLines={1} className="text-text-secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
