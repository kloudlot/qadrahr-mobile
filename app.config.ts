import type { ExpoConfig } from "expo/config";

/**
 * A function rather than a static object so per-environment values come
 * from the environment at build time.
 *
 * THE TRADE, and it bites the first time someone runs `eas init`: EAS
 * cannot write into a dynamic config. `eas init` creates the project on
 * the server and then fails trying to inject `extra.eas.projectId` back
 * into this file — on older CLIs with the unhelpful message
 * "Unexpected token '{'", which reads like a syntax error in a file
 * that is perfectly valid. `npx expo config` parses it fine.
 *
 * So the project id is set HERE, by hand, once. It is not a secret — it
 * identifies the project, it does not authorise anything — and push
 * token registration needs it at runtime.
 *
 *   eas init --id <project-id>     # links without rewriting this file
 *   eas project:info               # shows the id once linked
 */
/**
 * The Expo account the project lives under. Required for a build to
 * resolve to the right account when more than one is signed in.
 */
const OWNER = "kloudlot";

/**
 * From `eas init`, or the project page on expo.dev.
 *
 * QadraHR needs its OWN Expo project (never the HR Suite or legacy Qadra
 * one): run `eas init`, then either paste the id here as the fallback or
 * set EAS_PROJECT_ID. A dynamic config cannot be rewritten by the CLI.
 * While it is empty, push registration returns null at runtime —
 * `lib/push.ts` treats a missing id as "push is not configured here" —
 * and OTA updates are off.
 */
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? "";

/**
 * Fails an EAS build that would ship pointing at the wrong API.
 *
 * Only the development profile may use plain http (a laptop on the LAN).
 * Every other profile needs an https URL, set in `eas.json` or with
 * `eas env:create` — a binary that silently talks to a private address is
 * found by an employee at the gate, not by the build.
 *
 * Checked on the build worker only (`EAS_BUILD`), so local `expo start`
 * and `npx expo config` are unaffected.
 */
function assertReleaseApiUrl(): void {
  if (process.env.EAS_BUILD !== "true") return;
  const profile = process.env.EAS_BUILD_PROFILE;
  if (profile === "development") return;

  const url = process.env.EXPO_PUBLIC_API_URL ?? "";
  if (!url.startsWith("https://") || url.includes("REPLACE-ME")) {
    throw new Error(
      `EAS profile "${profile}" needs EXPO_PUBLIC_API_URL set to the https API (got "${url || "nothing"}").`,
    );
  }
}

/**
 * What the app is called on the home screen and in permission prompts.
 * Operator-configured, the same name the API serves from GET /platform,
 * and read at runtime from the same variable (lib/env.ts).
 */
const PRODUCT_NAME = process.env.EXPO_PUBLIC_PRODUCT_NAME || "QadraHR";

export default (): ExpoConfig => {
  assertReleaseApiUrl();
  return config();
};

const config = (): ExpoConfig => ({
  name: PRODUCT_NAME,
  slug: "qadrahr",
  owner: OWNER,
  version: "1.0.0",
  orientation: "portrait",
  scheme: "qadrahr",
  // Rendered from assets/source/*.svg by `npm run icons`, which is also
  // how an operator rebrands them: icons are baked into the binary, so
  // they follow the operator's build, not a tenant's runtime branding.
  icon: "./assets/icon.png",
  // Dark mode is out of scope for this release — the surface ramp is
  // structured so it stays possible, but nothing is designed for it, and
  // letting the OS flip it would produce unreadable screens rather than a
  // dark theme.
  // Follows the phone; the in-app Appearance setting can override it.
  userInterfaceStyle: "automatic",

  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.kloudlot.qadrahr",
    infoPlist: {
      // Clock-in is geofenced, so the reason string has to say what it is
      // for. "To provide a better experience" gets apps rejected and tells
      // the employee nothing.
      NSLocationWhenInUseUsageDescription:
        `${PRODUCT_NAME} checks you are at your workplace when you clock in or out.`,
      NSFaceIDUsageDescription: `Unlock ${PRODUCT_NAME} with Face ID.`,
      // Both reason strings name the actual use. "To provide a better
      // experience" gets apps rejected and tells the employee nothing
      // about what their camera roll is being read for.
      NSCameraUsageDescription: `${PRODUCT_NAME} uses the camera to photograph receipts for expense claims.`,
      NSPhotoLibraryUsageDescription:
        `${PRODUCT_NAME} lets you attach a receipt you have already photographed to an expense claim.`,
    },
  },

  android: {
    package: "com.kloudlot.qadrahr",
    // Firebase config, which Android needs before it will issue the push
    // token Expo's service sends through. Not committed: EAS supplies the
    // file as the GOOGLE_SERVICES_JSON file variable (a local build sets it
    // to ./google-services.json). Unset, the app builds and push stays off
    // on Android — see docs/PUSH.md.
    ...(process.env.GOOGLE_SERVICES_JSON
      ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON }
      : {}),
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      // The same white glyph: Android 13+ tints it for themed icons.
      monochromeImage: "./assets/adaptive-icon.png",
      backgroundColor: "#168AAD",
    },
  },

  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-font",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        // The page colours of lib/theme/tokens.ts, so the splash hands over
        // to the first screen without a flash.
        backgroundColor: "#F6F7F9",
        dark: { image: "./assets/splash-icon.png", backgroundColor: "#0E1017" },
      },
    ],
    [
      "expo-notifications",
      {
        // A WHITE SILHOUETTE: Android tints it, and anything with colour
        // in it renders as a grey blob.
        icon: "./assets/notification-icon.png",
        color: "#168AAD",
        // Where FCM puts a push naming a channel this phone lacks. Without
        // it Android uses a silent "Miscellaneous" channel; `general` is
        // created at HIGH importance in lib/push.ts, so it still pops up.
        defaultChannel: "general",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          `${PRODUCT_NAME} lets you attach a receipt you have already photographed to an expense claim.`,
        cameraPermission:
          `${PRODUCT_NAME} uses the camera to photograph receipts for expense claims.`,
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          `${PRODUCT_NAME} checks you are at your workplace when you clock in or out.`,
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  ...(EAS_PROJECT_ID ? { updates: { url: `https://u.expo.dev/${EAS_PROJECT_ID}` } } : {}),

  runtimeVersion: {
    // Tied to the native layer, not the app version. An OTA update must
    // only reach builds whose native modules can run it — expo-location
    // and expo-image-picker both have native sides, so a JS-only update
    // shipped to an older binary would crash on first use.
    policy: "appVersion",
  },

  extra: {
    eas: EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : {},
  },
});
