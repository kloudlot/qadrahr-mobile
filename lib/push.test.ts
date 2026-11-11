import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { http } from "./api";
import { ANDROID_CHANNELS, FOREGROUND_BEHAVIOUR, registerForPush, watchPushTokenRotation } from "./push";

// expo-notifications reports the device token to the token listener on every
// successful fetch (Android and iOS both), not only when it rotates. These
// mocks behave the same way, which is what made registration loop forever
// against /me/notifications/devices.
let mockTokenListener: ((token: { type: string; data: string }) => void) | null = null;
let mockDeviceToken = "fcm-1";

jest.mock("expo-notifications", () => ({
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  deleteNotificationChannelAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(async () => {
    const data = mockDeviceToken;
    setTimeout(() => mockTokenListener?.({ type: "android", data }), 0);
    return { data: `ExponentPushToken[${data}]` };
  }),
  addPushTokenListener: jest.fn((listener: typeof mockTokenListener) => {
    mockTokenListener = listener;
    return { remove: () => (mockTokenListener = null) };
  }),
}));
jest.mock("expo-device", () => ({ isDevice: true }));
jest.mock("expo-constants", () => ({ expoConfig: { extra: { eas: { projectId: "p" } } } }));
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock("./api", () => ({ http: { post: jest.fn(async () => ({})), delete: jest.fn() } }));

const settle = async () => {
  for (let i = 0; i < 50; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("push registration", () => {
  beforeEach(() => {
    (http.post as jest.Mock).mockClear();
    mockDeviceToken = "fcm-1";
  });

  it("does not re-register when a fetch reports the same token back", async () => {
    const stop = watchPushTokenRotation();
    await registerForPush({ prompt: false });
    await settle();
    stop();

    // The launch registration, plus at most one for the first token the
    // listener sees. Before the fix this kept climbing.
    expect((http.post as jest.Mock).mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("still re-registers when the token really changes", async () => {
    const stop = watchPushTokenRotation();
    await registerForPush({ prompt: false });
    await settle();
    const before = (http.post as jest.Mock).mock.calls.length;

    mockDeviceToken = "fcm-2";
    mockTokenListener?.({ type: "android", data: "fcm-2" });
    await settle();
    stop();

    expect((http.post as jest.Mock).mock.calls.length).toBeGreaterThan(before);
    expect(http.post).toHaveBeenLastCalledWith("/me/notifications/devices", {
      token: "ExponentPushToken[fcm-2]",
      platform: expect.any(String),
    });
  });

  it("shares one registration between callers that ask at once", async () => {
    await Promise.all([registerForPush({ prompt: false }), registerForPush({ prompt: false })]);
    expect(http.post).toHaveBeenCalledTimes(1);
  });
});

describe("how a push shows", () => {
  it("holds back the system banner while the app is open, for the app's own toast", () => {
    // The app shows a tappable toast instead (app/(app)/_layout.tsx); a
    // banner as well would say everything twice.
    expect(FOREGROUND_BEHAVIOUR).toMatchObject({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: true,
    });
  });

  it("creates every Android channel the server posts to as a heads-up channel, and retires the silent one", async () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "android", configurable: true });
    try {
      await registerForPush({ prompt: false });
    } finally {
      Object.defineProperty(Platform, "OS", { value: original, configurable: true });
    }

    const created = (Notifications.setNotificationChannelAsync as jest.Mock).mock.calls.map(
      ([id, options]) => [id, options.importance],
    );
    // The ids the backend's androidChannelFor returns, all HIGH.
    expect(created).toEqual(
      expect.arrayContaining(
        ["approvals", "pay", "announcements", "general"].map((id) => [id, Notifications.AndroidImportance.HIGH]),
      ),
    );
    expect(ANDROID_CHANNELS.map((c) => c.id)).not.toContain("default");
    // Its importance can never be raised on a phone that has it, so it goes.
    expect(Notifications.deleteNotificationChannelAsync).toHaveBeenCalledWith("default");
  });
});
