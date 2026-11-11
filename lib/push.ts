import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

import { http } from "./api";
import type { Body } from "@/lib/api/types";

/**
 * Push registration.
 *
 * Deliberately shorter than velo-mobile's equivalent, which carries an
 * `expo | fcm` transport seam. That seam exists there because its
 * backend sent through Firebase Admin while the app registered Expo
 * tokens, and every send failed silently. This backend has
 * `expo-push.adapter.ts` and a DTO that validates
 * `^(ExponentPushToken|ExpoPushToken)\[...\]`, so the question is already
 * settled and the abstraction would be dead weight.
 *
 * Everything here fails quietly. No push is a degraded experience, not a
 * broken one, and an employee who cannot clock in because a notification
 * permission dialog was declined would be a much worse bug than the one
 * this prevents.
 *
 * The server decides WHAT is pushed (every notification, minus the
 * categories muted in Notification settings) and forgets this device
 * whenever the session ends anywhere — signing in on the web included.
 */

/**
 * Foreground behaviour. An employee looking at the app still wants to
 * know their leave was approved — but the app says so itself, with a
 * tappable toast (`usePushReceived` in app/(app)/_layout.tsx), so the
 * system banner is held back rather than shown twice. The notification
 * still goes to the tray and still plays its sound, and the badge follows
 * the server's unread count, which every push carries.
 */
export const FOREGROUND_BEHAVIOUR: Notifications.NotificationBehavior = {
  shouldShowBanner: false,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => FOREGROUND_BEHAVIOUR,
});

export type PushRegistration = Body<"POST /me/notifications/devices">;

/** The token this device last registered, so sign-out never has to ask the OS again. */
const REGISTERED_TOKEN = "push.token";

/**
 * Android channels, one per kind of alert the server sends to them
 * (`androidChannelFor` in the backend's notification-categories.ts). The
 * ids must match; app.config.ts points FCM's fallback at `general` for a
 * push naming one the device lacks.
 *
 * Every channel is HIGH importance, which is what makes Android pop a
 * heads-up banner: an announcement or an approved request should arrive
 * like any other app's alert, not sit unseen in the tray.
 *
 * A channel's importance is fixed once it exists on a phone — the app can
 * never raise it — which is why the old `default` (created at DEFAULT
 * importance, so silent) is deleted and replaced rather than updated.
 */
export const ANDROID_CHANNELS = [
  { id: "approvals", name: "Approvals" },
  { id: "pay", name: "Payslips" },
  { id: "announcements", name: "Announcements" },
  { id: "general", name: "Updates" },
] as const;

const RETIRED_CHANNELS = ["default"];

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Promise.all([
    ...ANDROID_CHANNELS.map((channel) =>
      Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        showBadge: true,
      }),
    ),
    ...RETIRED_CHANNELS.map((id) =>
      Notifications.deleteNotificationChannelAsync(id).catch(() => undefined),
    ),
  ]);
}

export type PushPermission = "granted" | "denied" | "undetermined";

/**
 * Whether the OS lets this app notify. `denied` means it can no longer ask
 * — only the system settings can change it.
 */
export async function pushPermission(): Promise<PushPermission> {
  if (!Device.isDevice) return "denied";
  const status = await Notifications.getPermissionsAsync();
  if (status.granted) return "granted";
  return status.canAskAgain ? "undetermined" : "denied";
}

/**
 * The device's Expo push token, or null.
 *
 * Null is the normal answer in three situations, none of which is an
 * error: a simulator (no push hardware), a declined permission, and a
 * missing EAS project id (a local build that was never configured for
 * push). Returning null for all three keeps the caller from having to
 * tell them apart, because the response is the same in each case — do
 * nothing.
 *
 * Asks for permission only when `prompt` is set and the OS still allows
 * asking; a refused prompt is never re-shown on its own.
 */
export async function getPushToken({ prompt = true } = {}): Promise<PushRegistration | null> {
  if (!Device.isDevice) return null;

  // Android shows nothing at all without a channel. Created before the
  // permission ask, because the OS attaches the first notification to it.
  await ensureAndroidChannels();

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted && prompt && existing.canAskAgain) {
    granted = (await Notifications.requestPermissionsAsync()).granted;
  }
  if (!granted) return null;

  const projectId = (Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId) as string | undefined;
  if (!projectId) return null;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token: data, platform: Platform.OS === "ios" ? "ios" : "android" };
  } catch {
    // Expo's token service is unreachable, or this build has no push
    // entitlement. Neither is worth surfacing.
    return null;
  }
}

/**
 * Registers this device for push. Idempotent on the server.
 *
 * Called on every launch with a session and on every return to the
 * foreground, because a token can rotate without the app being
 * reinstalled — and because signing in on the web forgets this device,
 * and the next session here has to register again.
 */
export async function registerForPush({ prompt = true } = {}): Promise<string | null> {
  // Launch, foreground and token rotation can all ask at once; one
  // registration answers them all.
  inFlight ??= (async () => {
    const registration = await getPushToken({ prompt });
    if (!registration) return null;
    return sendRegistration(registration);
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

let inFlight: Promise<string | null> | null = null;

async function sendRegistration(registration: PushRegistration): Promise<string | null> {
  try {
    await http.post("/me/notifications/devices", registration);
    await SecureStore.setItemAsync(REGISTERED_TOKEN, registration.token);
    return registration.token;
  } catch {
    return null;
  }
}

/**
 * Re-registers when the OS hands the app a new device token. Returns the
 * unsubscribe.
 */
export function watchPushTokenRotation(): () => void {
  let lastDeviceToken: string | null = null;
  const subscription = Notifications.addPushTokenListener(({ data }) => {
    // This fires on every successful token fetch, not only on rotation:
    // expo-notifications reports the fetched token as "new" on Android
    // (PushTokenModule calls onNewToken after the fetch) and iOS alike, and
    // registerForPush fetches. Reacting to an unchanged token therefore
    // looped forever, posting to /me/notifications/devices several times a
    // second (seen from the Android preview build on 2026-11-06).
    const token = typeof data === "string" ? data : JSON.stringify(data);
    if (token === lastDeviceToken) return;
    lastDeviceToken = token;
    // The listener hands over the raw device token; the server wants the
    // Expo one, which is derived from it.
    void registerForPush({ prompt: false });
  });
  return () => subscription.remove();
}

/**
 * Unregisters on sign-out.
 *
 * Matters more than it looks, and the backend's own comment says why: a
 * shared device signed out of but still registered keeps delivering one
 * employee's payslip alerts to whoever holds the phone next.
 *
 * Uses the token this device registered rather than asking the OS for it
 * again, which could put a permission prompt in front of someone who is
 * signing out.
 *
 * Awaited, unlike the logout call — this one has to reach the server
 * while the token is still valid, and it is the difference between a
 * privacy leak and a courtesy.
 */
export async function unregisterFromPush(): Promise<void> {
  const token = await SecureStore.getItemAsync(REGISTERED_TOKEN).catch(() => null);

  if (token) {
    try {
      await http.delete("/me/notifications/devices", { data: { token } });
    } catch {
      // The session may already be gone, in which case the server has
      // already forgotten this device.
    }
  }
  await forgetPushRegistration();
}

/**
 * Local clean-up for a session that ended elsewhere: the server has
 * already dropped this device, so there is nothing to call — just the
 * remembered token and the icon badge.
 */
export async function forgetPushRegistration(): Promise<void> {
  await SecureStore.deleteItemAsync(REGISTERED_TOKEN).catch(() => undefined);
  await Notifications.setBadgeCountAsync(0).catch(() => false);
}
