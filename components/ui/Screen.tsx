import type { ReactNode } from "react";
import { RefreshControl, View } from "react-native";
import { KeyboardAvoidingView, KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTabBarSpace } from "@/components/navigation/tabBarSpace";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

export interface ScreenProps {
  children: ReactNode;
  /** Scrollable by default; turn it off for a screen that must not move. */
  scroll?: boolean;
  /** Removes the horizontal gutter, for full-bleed content like a list. */
  flush?: boolean;
  className?: string;
  /**
   * A `<HeroHeader>` at the top of the scroll. The content after it
   * overlaps its lower edge, which is what makes the cards feel lifted
   * off the brand colour.
   */
  hero?: ReactNode;
  /** A fixed `<ScreenHeader>` above the scroll, for pushed screens. */
  header?: ReactNode;
  /** Pinned to the bottom, above the safe area — a form's submit button. */
  footer?: ReactNode;
  /** A tab screen: leaves room for the floating tab bar. */
  tabs?: boolean;
  /** Pull to refresh. */
  refreshing?: boolean;
  onRefresh?: () => void;
}

/** Room left between the focused field and the keyboard (or the footer riding on it). */
const FIELD_GAP = 24;
/** A footer's height, roughly: one button and its padding. */
const FOOTER_SPACE = 88;

/**
 * The page frame every screen sits in.
 *
 * Owns the things no screen should have to think about: the 16px gutter,
 * the top and bottom safe areas (the bottom one with a 16px floor — a
 * device without a home indicator reports 0, which leaves a primary action
 * flush against the glass), room for the floating tab bar, and the page
 * colour in both schemes.
 */
export function Screen({
  children,
  scroll = true,
  flush = false,
  className,
  hero,
  header,
  footer,
  tabs = false,
  refreshing = false,
  onRefresh,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const tabSpace = useTabBarSpace();

  const paddingBottom = footer ? 16 : tabs ? tabSpace : Math.max(insets.bottom, 16);
  // A hero or a header draws under the status bar and pads itself.
  const paddingTop = hero || header ? 0 : insets.top + 8;

  const body = (
    <View
      className={cn("flex-1", !flush && "px-screen-x", className)}
      // Pulls the first card up over the hero's curved lower edge.
      style={hero ? { marginTop: -44 } : undefined}
    >
      {children}
    </View>
  );

  // Keyboard-aware on every screen, not by opt-in: a focused field scrolls
  // into view above the keyboard on both platforms. Opt-in is how a form
  // ended up with its field hidden behind the keyboard — and on Android the
  // old way did nothing at all, because edge-to-edge windows no longer
  // resize for the keyboard.
  const content = scroll ? (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1, paddingBottom, paddingTop }}
      bottomOffset={footer ? FOOTER_SPACE + FIELD_GAP : FIELD_GAP}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={hero ? colors.onBrand : colors.brand}
            colors={[colors.brand]}
            progressViewOffset={hero ? insets.top : 0}
          />
        ) : undefined
      }
    >
      {hero}
      {body}
    </KeyboardAwareScrollView>
  ) : (
    // A fixed screen can't scroll a field into view, so it shrinks instead.
    <KeyboardAvoidingView behavior="padding" className="flex-1" style={{ paddingBottom, paddingTop }}>
      {hero}
      {body}
    </KeyboardAvoidingView>
  );

  const footerPadding = Math.max(insets.bottom, 16);

  const framed = (
    <View className="flex-1 bg-bg-page">
      {header}
      {content}
      {footer ? (
        // Rides on top of the keyboard, so the submit button stays in reach;
        // the home-indicator padding tucks away while the keyboard is up.
        <KeyboardStickyView offset={{ closed: 0, opened: footerPadding - 12 }}>
          <View className="border-t border-border bg-bg-card px-screen-x pt-3" style={{ paddingBottom: footerPadding }}>
            {footer}
          </View>
        </KeyboardStickyView>
      ) : null}
    </View>
  );

  return framed;
}
