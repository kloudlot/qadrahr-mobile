import { useSafeAreaInsets } from "react-native-safe-area-context";

/** The floating tab bar's height. */
export const TAB_BAR_HEIGHT = 64;

/** How far the bar floats above the bottom edge (or the home indicator). */
export function useTabBarOffset(): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 12);
}

/**
 * The bottom padding a tab screen needs so its last item is not hidden
 * behind the floating bar.
 */
export function useTabBarSpace(): number {
  return TAB_BAR_HEIGHT + useTabBarOffset() + 16;
}
