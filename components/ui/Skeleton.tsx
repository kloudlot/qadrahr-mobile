import { useEffect } from "react";
import { View, type DimensionValue } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { Card } from "./Card";

/** A placeholder block that breathes while its content loads. */
export function Skeleton({
  width = "100%",
  height = 14,
  radius = 8,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 750 }), -1, true));
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      accessibilityElementsHidden
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.inset }, style]}
    />
  );
}

/** A stack of skeleton rows in a card — the default "loading a list" state. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="gap-5" accessibilityLabel="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} className="flex-row items-center gap-3">
          <Skeleton width={40} height={40} radius={12} />
          <View className="flex-1 gap-2">
            <Skeleton width="55%" height={14} />
            <Skeleton width="80%" height={12} />
          </View>
        </View>
      ))}
    </Card>
  );
}
