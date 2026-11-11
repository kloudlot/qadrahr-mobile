import { useSyncExternalStore } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { focusManager, onlineManager } from "@tanstack/react-query";

/**
 * Teaches TanStack Query what "online" means on this platform.
 *
 * It does not know by default. `onlineManager`'s built-in detection
 * listens for the browser's `online` event, which does not exist in
 * React Native, so without this every request is attempted as though the
 * connection were fine — and the app only discovers otherwise by letting
 * one fail, which costs the full 30s request timeout before screen 03
 * can say "saved, it'll sync when you're back online".
 *
 * That is the whole reason @react-native-community/netinfo is a
 * dependency here. It is a correctness dependency, not a convenience
 * one: without it the offline path is technically present and
 * practically unusable.
 */
export function startConnectivityWatch(): void {
  // setEventListener returns void; the cleanup NetInfo hands back is
  // what onlineManager calls when it replaces the listener.
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      // `isInternetReachable` is null while NetInfo is still probing.
      // Treating null as offline would make the app look disconnected
      // for the first second of every launch, so only an explicit false
      // counts against a connected interface.
      setOnline(
        Boolean(state.isConnected) && state.isInternetReachable !== false,
      );
    }),
  );
}

/**
 * Teaches TanStack Query what "focused" means: the app being in the
 * foreground.
 *
 * Its built-in detection listens for the browser's `visibilitychange`,
 * which React Native never fires, so a query never refetched when the app
 * came back from the background — the bell kept the count from whenever
 * the screen first mounted, and an announcement only showed once the app
 * was closed and opened again.
 */
export function startFocusWatch(): void {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener("change", (status) => {
      setFocused(status === "active");
    });
    return () => subscription.remove();
  });
}

/** Whether the app believes it is online, as the punch queue and queries do. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true,
  );
}
