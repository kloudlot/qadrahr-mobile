import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloudOff } from "lucide-react-native";

import { Text } from "@/components/ui/Text";
import { useIsOnline } from "@/lib/connectivity";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * Says so when the phone is offline, and what that means here.
 *
 * Employees clock in on poor networks, and the design asks for a visible
 * offline state that says plainly what will and won't be saved — never a
 * silent failure. Clocking in is the one thing that works offline (it
 * queues on the phone); everything else needs a connection, and the
 * banner says both.
 *
 * Quiet through a brief drop: a banner that flashes on every momentary
 * loss of signal is one people learn to ignore.
 */
const GRACE_MS = 3000;

export function OfflineBanner() {
  const online = useIsOnline();
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  useEffect(() => {
    if (online) return;
    const timer = setTimeout(() => setVisible(true), GRACE_MS);
    // Back online, or unmounting: hide, and start the grace period afresh
    // next time.
    return () => {
      clearTimeout(timer);
      setVisible(false);
    };
  }, [online]);

  if (online || !visible) return null;

  return (
    // Floats below the status bar rather than pushing the screen down:
    // every screen already pads for the status bar itself.
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50 px-screen-x"
      style={{ top: insets.top + 8 }}
    >
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="flex-row items-start gap-3 rounded-2xl border border-warning bg-warning-subtle px-4 py-3"
      >
        <CloudOff size={18} color={colors.warning} />
        <View className="flex-1">
          <Text variant="small" className="font-semibold text-warning-ink">
            You&apos;re offline
          </Text>
          <Text variant="caption" className="text-warning-ink">
            Clock-ins are kept on this phone and sent when you&apos;re back
            online. Anything else needs a connection.
          </Text>
        </View>
      </View>
    </View>
  );
}
