import { useEffect, useState, type ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { Tabs } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useCardShadow } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

import { TAB_BAR_HEIGHT, useTabBarOffset } from "./tabBarSpace";

type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

/**
 * The bottom bar: a pill floating above the home indicator, with a tinted
 * lozenge that slides to the active tab.
 *
 * Tab screens pad themselves with `useTabBarSpace()` (via `<Screen tabs>`)
 * so nothing ends up under it. A tab can show a dot — Me does when there
 * is something waiting — through `tabBarBadge`. A tab given `href: null`
 * (a module the employer switched off) is left out.
 */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: TabBarProps) {
  const colors = useThemeColors();
  const { shadow, dark } = useCardShadow();
  const offset = useTabBarOffset();
  const [width, setWidth] = useState(0);

  // expo-router turns `href: null` into a hidden item style.
  const visible = state.routes.filter(
    (route) =>
      StyleSheet.flatten(descriptors[route.key]?.options.tabBarItemStyle)
        ?.display !== "none",
  );
  const focusedKey = state.routes[state.index]?.key;
  const slot = Math.max(
    0,
    visible.findIndex((route) => route.key === focusedKey),
  );

  const inner = width - 12;
  const tabWidth = inner / Math.max(1, visible.length);
  const x = useSharedValue(0);

  useEffect(() => {
    x.set(
      withTiming(slot * tabWidth, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [slot, tabWidth, x]);

  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 px-5"
      style={{ bottom: offset }}
    >
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        className={cn(
          "flex-row items-center rounded-3xl bg-bg-card px-1.5",
          dark && "border border-border",
        )}
        style={[
          { height: TAB_BAR_HEIGHT },
          shadow
            ? { ...shadow, shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 }
            : null,
        ]}
      >
        {width > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: 6,
                top: 8,
                bottom: 8,
                width: tabWidth,
                borderRadius: 18,
                backgroundColor: colors.brandSubtle,
              },
              indicator,
            ]}
          />
        ) : null}

        {visible.map((route) => {
          const { options } = descriptors[route.key]!;
          const focused = route.key === focusedKey;
          const label =
            typeof options.title === "string" ? options.title : route.name;
          const color = focused ? colors.brand : colors.textSecondary;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              void Haptics.selectionAsync();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              className="h-full flex-1 items-center justify-center gap-0.5"
            >
              <View>
                {options.tabBarIcon?.({ focused, color, size: 22 })}
                {options.tabBarBadge ? (
                  <View className="absolute -right-1.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-card bg-danger" />
                ) : null}
              </View>
              <Text
                variant="micro"
                numberOfLines={1}
                className={cn(
                  "normal-case tracking-normal",
                  focused ? "font-semibold text-brand" : "text-text-secondary",
                )}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
