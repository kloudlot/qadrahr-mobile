import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";

import { BiometricGate } from "@/components/BiometricGate";
import { ModuleGate } from "@/components/navigation/ModuleGate";
import { OfflineBanner } from "@/components/state/OfflineBanner";
import { toast } from "@/components/ui/Toast";
import { openNotification, type PushPayload } from "@/lib/openNotification";
import { registerForPush, watchPushTokenRotation } from "@/lib/push";
import { refreshForPush } from "@/lib/pushRefresh";
import { useAppBadge } from "@/lib/queries/notifications";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * The signed-in app: the five tabs, with every task and detail screen
 * pushed OVER them rather than inside a tab.
 *
 * A request form or a payslip is a task with a beginning and an end; it
 * gets the whole screen and a back button, not a tab bar that invites
 * wandering off half-way through.
 */
export default function AppLayout() {
  usePushRegistration();
  usePushReceived();
  usePushTaps();
  useAppBadge();
  const colors = useThemeColors();

  return (
    // Inside the signed-in tree only: the gate protects re-entry to a
    // session that already exists, and has nothing to say on the login
    // screen.
    <BiometricGate>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.page },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      <ModuleGate />
      <OfflineBanner />
    </BiometricGate>
  );
}

/**
 * Registers for push once there is a session, again whenever the app
 * comes back to the foreground (at most hourly), and whenever the OS
 * rotates the device token.
 *
 * Here rather than in the root layout because this tree only mounts once
 * someone is signed in — registering earlier would ask for a
 * notification permission on the login screen, before anyone has agreed
 * to anything.
 *
 * The foreground re-registration keeps the server's `lastSeenAt` honest
 * and heals a registration that failed on a bad connection. It never
 * prompts: a refused permission is changed in Notification settings.
 */
const REREGISTER_AFTER_MS = 60 * 60 * 1000;

function usePushRegistration(): void {
  const lastAttempt = useRef(0);

  useEffect(() => {
    const attempt = (prompt: boolean) => {
      lastAttempt.current = Date.now();
      // Failure is silent by design — see lib/push.ts.
      void registerForPush({ prompt });
    };
    attempt(true);

    const appState = AppState.addEventListener("change", (status) => {
      if (
        status === "active" &&
        Date.now() - lastAttempt.current > REREGISTER_AFTER_MS
      ) {
        attempt(false);
      }
    });
    const stopWatching = watchPushTokenRotation();
    return () => {
      appState.remove();
      stopWatching();
    };
  }, []);
}

/**
 * A push that arrives while the app is open refreshes what it is about,
 * so the bell, the Me tab dot and the list are right without a pull — and
 * says so with a toast that opens it, in place of the system banner the
 * foreground handler holds back (lib/push.ts).
 */
function usePushReceived(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        const payload = data as PushPayload;
        void refreshForPush(
          queryClient,
          typeof payload?.type === "string" ? payload.type : "",
        );
        if (title) {
          toast.notify(title, body ?? undefined, () =>
            openNotification(payload, queryClient),
          );
        }
      },
    );
    return () => subscription.remove();
  }, [queryClient]);
}

/**
 * A tapped push opens what it's about and marks it read — see
 * lib/openNotification.ts, which the in-app toast shares.
 */
function usePushTaps(): void {
  const queryClient = useQueryClient();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse) => {
      // The cold-start response and the listener can both report the same
      // tap; act once.
      const id = response.notification.request.identifier;
      if (handled.current === id) return;
      handled.current = id;

      openNotification(
        response.notification.request.content.data as PushPayload,
        queryClient,
      );
    };

    // Opened from a push while the app was closed. Cleared once acted on,
    // or the same tap would replay after the next sign-in remounts this.
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      open(last);
      Notifications.clearLastNotificationResponse();
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [queryClient]);
}
