import type { ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * A surface.
 *
 * A soft shadow in light mode, where it lifts a white card off the grey
 * page; a hairline border in dark mode, where a shadow on a dark page is
 * invisible and a lighter card is what separates it.
 */
export function Card({
  children,
  className,
  padded = true,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  className?: string;
  /** 16px inside. Off for full-bleed content such as a list of rows. */
  padded?: boolean;
  /** Makes the whole card a button. */
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const style = useCardShadow();
  const classes = cn(
    "rounded-2xl bg-bg-card",
    padded && "p-4",
    style.dark && "border border-border",
    className,
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        className={cn(classes, "active:opacity-90")}
        style={style.shadow}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={classes} style={style.shadow}>
      {children}
    </View>
  );
}

/** The card elevation for the current scheme — also used by the tab bar and sheets. */
export function useCardShadow(): { dark: boolean; shadow: ViewStyle | undefined } {
  const { scheme } = useThemeColors();
  if (scheme === "dark") return { dark: true, shadow: undefined };
  return {
    dark: false,
    shadow: {
      shadowColor: "#1C2030",
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  };
}
