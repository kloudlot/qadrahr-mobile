import { useEffect, useState, type ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";
import { KeyboardAvoidingView, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "./Text";

const HIDDEN = 900;

/**
 * A bottom sheet: the app's one way of asking for a small decision or a
 * short form without leaving the screen.
 *
 * Built on RN's Modal (its own native window, above the tab bar) with a
 * reanimated slide and drag-to-dismiss on the handle. Dismissing by
 * backdrop, drag or back button all go through `onClose`, so the parent
 * stays the one source of truth for whether it is open.
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  dismissable = true,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Actions pinned under the content. */
  footer?: ReactNode;
  /** Off while something is in flight, so a half-sent form is not thrown away. */
  dismissable?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(HIDDEN);
  const backdrop = useSharedValue(0);

  // Mount on open during render; unmount only after the closing slide.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      translateY.set(withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }));
      backdrop.set(withTiming(1, { duration: 220 }));
      return;
    }
    translateY.set(withTiming(HIDDEN, { duration: 220, easing: Easing.in(Easing.cubic) }));
    backdrop.set(withTiming(0, { duration: 220 }));
    const timer = setTimeout(() => setMounted(false), 230);
    return () => clearTimeout(timer);
  }, [visible, translateY, backdrop]);

  const close = () => {
    if (dismissable) onClose();
  };

  const drag = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((event) => {
      translateY.set(Math.max(0, event.translationY));
    })
    .onEnd((event) => {
      if (dismissable && (event.translationY > 120 || event.velocityY > 900)) {
        onClose();
      } else {
        translateY.set(withTiming(0, { duration: 180 }));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.get() }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* "padding" on both platforms: Android's edge-to-edge windows don't resize for the keyboard. */}
        <KeyboardAvoidingView className="flex-1 justify-end" behavior="padding">
          <Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: "rgba(12,14,22,0.55)" }, backdropStyle]}>
            <Pressable accessibilityLabel="Close" className="flex-1" onPress={close} />
          </Animated.View>

          <Animated.View style={[sheetStyle, { maxHeight: "92%" }]}>
            <View
              className="rounded-t-3xl bg-bg-card px-screen-x"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <GestureDetector gesture={drag}>
                <View className="items-center pb-2 pt-3" accessibilityElementsHidden>
                  <View className="h-1.5 w-10 rounded-pill bg-border-strong" />
                </View>
              </GestureDetector>

              {title ? (
                <View className="gap-1 pb-4 pt-1">
                  <Text variant="h2" className="text-text-primary">
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text variant="small" className="text-text-secondary">
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {/* Scrolls once the keyboard leaves too little room, focused field kept in view. */}
              <KeyboardAwareScrollView
                style={{ flexGrow: 0, flexShrink: 1 }}
                contentContainerClassName="gap-4"
                bottomOffset={16}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </KeyboardAwareScrollView>

              {footer ? <View className="gap-2 pt-5">{footer}</View> : null}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
