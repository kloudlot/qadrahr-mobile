import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";

import { Fingerprint } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { authenticate, isEnabled } from "@/lib/biometrics";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * Holds the app behind a biometric check when the preference is on.
 *
 * Gates RE-ENTRY, not sign-in. The session is already valid and the
 * tokens are already in the keychain; this stops the person who picks
 * the phone up next from reading a payslip, which on a shared shift
 * device is the case that matters.
 *
 * So it fails OPEN on anything unexpected — no hardware, nothing
 * enrolled, a prompt that could not be shown. An employee locked out of
 * an app they are signed in to, by a check that malfunctioned, has no
 * way forward except reinstalling.
 *
 * Re-locks when the app has been in the background long enough to have
 * changed hands. A check on every task-switch would fire when someone
 * glances at a text mid clock-in.
 */
const RELOCK_AFTER_MS = 60_000;

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  const unlock = useCallback(() => {
    setChecking(true);
    void (async () => {
      const passed = await authenticate();
      setLocked(!passed);
      setChecking(false);
    })();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "background" || status === "inactive") {
        backgroundedAt.current ??= Date.now();
        return;
      }

      if (status !== "active") return;

      const away = backgroundedAt.current;
      backgroundedAt.current = null;
      if (away === null || Date.now() - away < RELOCK_AFTER_MS) return;

      void (async () => {
        if (await isEnabled()) setLocked(true);
      })();
    });

    return () => subscription.remove();
  }, []);

  if (!locked) return <>{children}</>;

  return <Locked checking={checking} onUnlock={unlock} />;
}

function Locked({ checking, onUnlock }: { checking: boolean; onUnlock: () => void }) {
  const colors = useThemeColors();

  return (
    <Screen scroll={false}>
      <View className="flex-1 items-center justify-center gap-6 px-4">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-subtle">
          <Fingerprint size={44} color={colors.brand} />
        </View>
        <View className="items-center gap-2">
          <Text variant="h1" className="text-text-primary">
            Locked
          </Text>
          <Text variant="small" className="text-center text-text-secondary">
            Unlock to get back to your clock, leave and payslips.
          </Text>
        </View>
        <Button label="Unlock" size="lg" block loading={checking} onPress={onUnlock} />
      </View>
    </Screen>
  );
}
