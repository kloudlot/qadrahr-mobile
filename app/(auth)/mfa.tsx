import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { ShieldCheck } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { HeroHeader, HeroText } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { errorMessage } from "@/lib/api";
import { verifyMfa } from "@/lib/session";
import { useAuthStore } from "@/store/useAuthStore";

/** Six digits, or a hyphenated recovery code. Matches the server's rule. */
const CODE = /^\d{6}$|^[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}$/;

/**
 * The second factor. Part of screen 01.
 *
 * Two things about this flow are easy to get wrong, and both are the
 * server's design rather than a choice made here.
 *
 * The challenge is spent on FIRST use whether or not the code was right,
 * because a six-digit code that could be retried indefinitely is not a
 * second factor. So a rejection is terminal: this screen sends the
 * employee back to sign in rather than letting them try another code
 * against a challenge the server has already discarded. Re-prompting
 * would be the obvious UX and it would fail every time.
 *
 * And the challenge expires. The countdown is not decoration — it is the
 * difference between "type faster" and "start again", and an employee
 * who sees neither concludes the app is broken.
 */
export default function MfaScreen() {
  const challenge = useAuthStore((state) => state.pendingMfa);
  const abandon = useAuthStore((state) => state.mfaAbandoned);

  const colors = useThemeColors();
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(challenge?.expiresInSeconds ?? 0);

  // Ref rather than state: the interval reads it without re-subscribing,
  // and it must not restart the countdown on every tick. Set in the
  // effect, not here — reading the clock during render is impure, and
  // React may render this more than once.
  const expiresAt = useRef<number | null>(null);

  const mutation = useMutation({
    mutationFn: () => verifyMfa(challenge?.challengeToken ?? "", code),
    onError: (error) => {
      // Spent. Nothing here can recover it — but say why, because this
      // screen is gone before its own error line could be read.
      toast.error("That code didn't work", `${errorMessage(error)} Sign in again for a new code.`);
      giveUp();
    },
  });

  function giveUp() {
    abandon();
    router.replace("/(auth)");
  }

  useEffect(() => {
    if (!challenge) {
      // Arrived without a challenge — a deep link, or a reload during
      // development. There is nothing to verify.
      router.replace("/(auth)");
      return;
    }

    expiresAt.current ??= Date.now() + challenge.expiresInSeconds * 1000;

    const tick = setInterval(() => {
      const deadline = expiresAt.current ?? Date.now();
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) giveUp();
    }, 1000);

    return () => clearInterval(tick);
    // giveUp is stable for this screen's lifetime; re-running on it would
    // restart the countdown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge]);

  if (!challenge) return null;

  const canSubmit = CODE.test(code.trim()) && !mutation.isPending;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Screen
      hero={
        <HeroHeader bottom={96}>
          <View className="items-center gap-3 pt-10">
            <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white/20">
              <ShieldCheck size={30} color={colors.onBrand} />
            </View>
            <HeroText variant="h1" className="font-bold">
              Two-step check
            </HeroText>
            <HeroText variant="small" muted className="text-center">
              {secondsLeft > 0 ? `Expires in ${minutes}:${seconds}` : "This code request has expired."}
            </HeroText>
          </View>
        </HeroHeader>
      }
    >
      <Card className="gap-5 p-5">
        <Text variant="small" className="text-text-secondary">
          Open your authenticator app and enter the six-digit code. You can use a recovery code instead.
        </Text>

        <Field label="Code" error={mutation.isError ? errorMessage(mutation.error) : null}>
          <Input
            accessibilityLabel="Authentication code"
            value={code}
            onChangeText={setCode}
            autoFocus
            autoCapitalize="none"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            keyboardType="default"
            maxLength={14}
            returnKeyType="go"
            onSubmitEditing={() => canSubmit && mutation.mutate()}
            placeholder="123456"
            className="h-14 text-center text-h2 tracking-wide"
            style={{ fontVariant: ["tabular-nums"] }}
          />
        </Field>

        <View className="gap-3">
          <Button label="Verify" size="lg" block loading={mutation.isPending} disabled={!canSubmit} onPress={() => mutation.mutate()} />
          <Button label="Back to sign in" variant="ghost" block onPress={giveUp} />
        </View>
      </Card>
    </Screen>
  );
}
