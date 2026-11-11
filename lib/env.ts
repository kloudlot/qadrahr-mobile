/**
 * Runtime configuration.
 *
 * `EXPO_PUBLIC_*` variables are inlined at build time and are readable by
 * anyone with the binary — so nothing secret goes here. The API base URL is
 * not secret; the tokens that talk to it are, and those live in
 * expo-secure-store.
 */

/** The API's default port on the developer's own machine. Dev builds only. */
const DEV_API_URL = "http://localhost:3000/api/v1";

/**
 * Where the API lives.
 *
 * A simulator can reach `localhost`; a physical device cannot, and needs the
 * host machine's LAN address. That is the single most common "it works on my
 * machine" in Expo development, which is why this is configurable rather
 * than hardcoded — put your LAN address in `.env` (gitignored).
 *
 * A release build with no URL refuses to start rather than quietly talking
 * to localhost. `app.config.ts` stops an EAS build before it gets that far.
 */
export const API_URL = resolveApiUrl();

function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured;
  if (__DEV__) return DEV_API_URL;
  throw new Error("EXPO_PUBLIC_API_URL is not set for this release build.");
}

/**
 * How early to refresh an access token, in seconds before it expires.
 *
 * Refreshing reactively on a 401 costs the user a visible stall on whatever
 * they were doing. Refreshing 120s early means the token is almost never the
 * thing that fails — and the 401 path still exists for the case where the
 * clock is wrong or the app was backgrounded through the window.
 */
export const REFRESH_SKEW_SECONDS = 120;

/** Requests that take longer than this have failed, whatever the server thinks. */
export const REQUEST_TIMEOUT_MS = 30_000;

/**
 * What the app calls the product. Operator-configured, never hardcoded:
 * the same name the API serves from GET /platform, set per build so the
 * home-screen name (app.config.ts) and the screens agree.
 */
export const PRODUCT_NAME = process.env.EXPO_PUBLIC_PRODUCT_NAME || "QadraHR";
