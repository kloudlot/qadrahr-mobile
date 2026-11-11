import * as SecureStore from "expo-secure-store";

/**
 * Token storage.
 *
 * expo-secure-store, not AsyncStorage: these are bearer credentials for
 * somebody's salary data. SecureStore puts them in the iOS keychain and the
 * Android keystore, where another app on the device cannot read them and
 * they do not end up in a filesystem backup in plaintext.
 */

const ACCESS_TOKEN = "qadrahr.accessToken";
const REFRESH_TOKEN = "qadrahr.refreshToken";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export async function readTokens(): Promise<StoredTokens | null> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN),
      SecureStore.getItemAsync(REFRESH_TOKEN),
    ]);

    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  } catch {
    // A keychain read can fail on a device that has just been restored, or
    // where the item was written under a different keychain access group.
    // Treating that as "signed out" sends the user to a login screen, which
    // is recoverable. Throwing here would crash on launch.
    return null;
  }
}

export async function writeTokens(tokens: StoredTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN),
    SecureStore.deleteItemAsync(REFRESH_TOKEN),
  ]);
}

/**
 * Reads the `exp` claim without verifying the signature.
 *
 * Deliberately unverified: the client cannot verify anything — it does not
 * have the secret — and does not need to. The server verifies on every
 * request. This is used only to decide *when to refresh*, which is a
 * scheduling question. A forged token would fail at the server regardless.
 *
 * Returns null on anything malformed, which callers treat as "expired".
 */
export function readExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    // base64url → base64, then pad.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

    const decoded = JSON.parse(globalThis.atob(padded)) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}
