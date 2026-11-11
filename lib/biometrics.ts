import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { PRODUCT_NAME } from "./env";

/**
 * Biometric unlock.
 *
 * What this is and is not: it gates re-entry to an app that ALREADY has
 * a valid session on this device. It is not a second factor and it does
 * not authenticate anyone to the server — the tokens in SecureStore are
 * what do that, and they are protected by the OS keychain whether or not
 * this is switched on.
 *
 * So a failed or unavailable biometric check never signs anyone out. The
 * worst it does is decline to skip the lock screen, and the honest
 * fallback is the device passcode, which `authenticateAsync` offers.
 *
 * The preference is stored per device rather than per account: it is a
 * property of "this phone", and a shared shift device where one employee
 * enrolled their face must not present that as an option to the next.
 */

const PREFERENCE_KEY = "qadrahr.biometricUnlock";

export interface BiometricCapability {
  /** Hardware exists and at least one identity is enrolled. */
  available: boolean;
  /** "Face ID", "Touch ID", or "Biometric unlock" where unknown. */
  label: string;
}

export async function getCapability(): Promise<BiometricCapability> {
  try {
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    return {
      // Both matter. Hardware with nothing enrolled offers a prompt the
      // user cannot satisfy, which reads as the app being broken.
      available: hasHardware && enrolled,
      label: describe(types),
    };
  } catch {
    return { available: false, label: "Biometric unlock" };
  }
}

function describe(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return "Face ID";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return "Touch ID";
  }
  return "Biometric unlock";
}

export async function isEnabled(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(PREFERENCE_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function setEnabled(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await SecureStore.setItemAsync(PREFERENCE_KEY, "true");
    } else {
      await SecureStore.deleteItemAsync(PREFERENCE_KEY);
    }
  } catch {
    // A device that cannot store the preference simply does not have
    // one. Nothing here is load-bearing.
  }
}

/**
 * Prompts, and says whether the person got through.
 *
 * Returns true when biometrics are unavailable or switched off, because
 * the caller's question is "may this person proceed", and the answer
 * when there is no lock is yes. A function that returned false for
 * "no lock configured" would lock everyone out of an app they are
 * already signed in to.
 */
export async function authenticate(reason = `Unlock ${PRODUCT_NAME}`): Promise<boolean> {
  if (!(await isEnabled())) return true;

  const capability = await getCapability();
  if (!capability.available) return true;

  return promptOnce(reason, { failOpen: true });
}

/**
 * Prompts regardless of the stored preference.
 *
 * Needed at ENROLMENT, where the preference is by definition still off
 * and `authenticate()` would therefore return true without asking
 * anything. Storing a preference the person cannot then satisfy would
 * lock them behind a check they never passed, so the prompt is the
 * confirmation.
 *
 * `failOpen` is the difference between the two callers. Unlocking an
 * app someone is already signed in to fails open — a malfunctioning
 * prompt must not strand them. Turning the setting ON fails closed: if
 * the check did not succeed, the answer is no.
 */
export async function promptOnce(
  reason: string,
  options: { failOpen: boolean },
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      // The device passcode is the honest fallback: someone whose face
      // is not recognised in bad light still owns the phone.
      disableDeviceFallback: false,
      cancelLabel: "Cancel",
    });
    return result.success;
  } catch {
    return options.failOpen;
  }
}
