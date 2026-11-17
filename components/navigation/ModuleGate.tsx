import { StyleSheet, View } from "react-native";
import { router, usePathname } from "expo-router";
import { Lock } from "lucide-react-native";

import { EmptyView } from "@/components/state/StateViews";
import { moduleForPath } from "@/lib/moduleRoutes";
import { useModules } from "@/lib/queries/modules";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * Covers a screen whose module this employer doesn't have for the
 * employee's company — not in the plan, or switched off — when it is
 * reached by a deep link, a push notification or a stale back stack
 * rather than the menus, which already leave it out. Says so instead of
 * a screen full of refusals.
 *
 * An overlay rather than a replacement, so the navigator underneath stays
 * mounted and "Go back" has somewhere to go.
 */
export function ModuleGate() {
  const pathname = usePathname();
  const { has } = useModules();
  const colors = useThemeColors();
  const needed = moduleForPath(pathname);
  if (!needed || has(needed)) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.page }]}>
      <EmptyView
        icon={Lock}
        title="Not available"
        detail="Your employer hasn't turned this on for your company."
        action={{
          label: router.canGoBack() ? "Go back" : "Go home",
          onPress: () =>
            router.canGoBack() ? router.back() : router.replace("/"),
        }}
      />
    </View>
  );
}
