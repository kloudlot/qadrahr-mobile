import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, CircleAlert, CircleCheck, Info } from "lucide-react-native";
import { create } from "zustand";

import { useCardShadow } from "./Card";
import { Text } from "./Text";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

type ToastKind = "success" | "error" | "info" | "push";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
  /** What a tap does, beyond dismissing. A push toast opens what it is about. */
  onPress?: () => void;
}

interface ToastState {
  current: ToastItem | null;
  show: (toast: Omit<ToastItem, "id">) => void;
  dismiss: () => void;
}

let nextId = 1;

const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: (toast) => set({ current: { ...toast, id: nextId++ } }),
  dismiss: () => set({ current: null }),
}));

/**
 * A short confirmation at the top of the screen — "Leave requested" —
 * callable from anywhere, including a mutation's onSuccess.
 */
export const toast = {
  success: (title: string, message?: string) => useToastStore.getState().show({ kind: "success", title, message }),
  error: (title: string, message?: string) => useToastStore.getState().show({ kind: "error", title, message }),
  info: (title: string, message?: string) => useToastStore.getState().show({ kind: "info", title, message }),
  /**
   * A notification that arrived while the app was open — shown here
   * instead of the system banner, and opening it on a tap.
   */
  notify: (title: string, message?: string, onPress?: () => void) =>
    useToastStore.getState().show({ kind: "push", title, message, onPress }),
};

/** How long each kind stays: long enough to read a notification, not to block the screen. */
const DURATION_MS: Record<ToastKind, number> = { success: 3200, info: 3200, error: 5000, push: 6000 };

/** Mounted once, at the root. */
export function ToastHost() {
  const current = useToastStore((state) => state.current);
  const dismiss = useToastStore((state) => state.dismiss);
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { shadow, dark } = useCardShadow();

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(dismiss, DURATION_MS[current.kind]);
    return () => clearTimeout(timer);
  }, [current, dismiss]);

  if (!current) return null;

  const Icon =
    current.kind === "success" ? CircleCheck : current.kind === "error" ? CircleAlert : current.kind === "push" ? Bell : Info;
  const tint =
    current.kind === "success"
      ? colors.success
      : current.kind === "error"
        ? colors.danger
        : current.kind === "push"
          ? colors.brand
          : colors.info;
  const press = () => {
    dismiss();
    current.onPress?.();
  };

  return (
    <View pointerEvents="box-none" className="absolute left-0 right-0 px-screen-x" style={{ top: insets.top + 8 }}>
      <Animated.View key={current.id} entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(180)}>
        <Pressable
          accessibilityRole={current.onPress ? "button" : "alert"}
          accessibilityLiveRegion="polite"
          accessibilityHint={current.onPress ? "Opens it" : undefined}
          onPress={press}
          className={`flex-row items-start gap-3 rounded-2xl bg-bg-card px-4 py-3 ${dark ? "border border-border" : ""}`}
          style={shadow ? { ...shadow, shadowOpacity: 0.16, elevation: 6 } : undefined}
        >
          <Icon size={22} color={tint} />
          <View className="flex-1 gap-0.5">
            <Text variant="small" className="font-semibold text-text-primary">
              {current.title}
            </Text>
            {current.message ? (
              <Text variant="caption" className="text-text-secondary" numberOfLines={current.kind === "push" ? 3 : undefined}>
                {current.message}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
