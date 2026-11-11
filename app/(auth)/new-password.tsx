import { useEffect, useState } from "react";
import { View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { KeyRound } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { HeroHeader, HeroText } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { errorMessage } from "@/lib/api";
import { firstPasswordChange } from "@/lib/session";
import { useAuthStore } from "@/store/useAuthStore";

/** The server's rule (FirstPasswordChangeDto). */
const MIN_LENGTH = 8;

/**
 * Choosing your own password, when the one you signed in with was chosen by
 * someone else: the operator who set up the organisation, or an admin who
 * typed one in. Sign-in can't finish without it.
 *
 * Unlike the second factor, a refused password does not spend the
 * challenge (it already proved the old password was right), so this screen
 * lets the employee try again. An expired challenge sends them back.
 */
export default function NewPasswordScreen() {
  const challenge = useAuthStore((state) => state.pendingPasswordChange);
  const abandon = useAuthStore((state) => state.passwordChangeAbandoned);
  const colors = useThemeColors();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => firstPasswordChange(challenge?.challengeToken ?? "", password),
    onSuccess: (result) => {
      // Signed in: the root layout swaps stacks on its own. Two-factor
      // accounts go on to their code.
      if (result.status === "mfa_required") router.replace("/(auth)/mfa");
    },
    onError: (error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        toast.error("That took too long", "Sign in again with the password you were given.");
        giveUp();
      }
    },
  });

  function giveUp() {
    abandon();
    router.replace("/(auth)");
  }

  useEffect(() => {
    // Arrived without a challenge — a deep link, or a reload.
    if (!challenge) router.replace("/(auth)");
  }, [challenge]);

  if (!challenge) return null;

  function submit() {
    if (password.length < MIN_LENGTH) {
      setLocalError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setLocalError("The two passwords don't match.");
      return;
    }
    setLocalError(null);
    mutation.mutate();
  }

  const serverError = mutation.isError ? errorMessage(mutation.error) : null;

  return (
    <Screen
      hero={
        <HeroHeader bottom={96}>
          <View className="items-center gap-3 pt-10">
            <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white/20">
              <KeyRound size={30} color={colors.onBrand} />
            </View>
            <HeroText variant="h1" className="font-bold">
              Choose your password
            </HeroText>
            <HeroText variant="small" muted className="text-center">
              The one you signed in with was set by someone else.
            </HeroText>
          </View>
        </HeroHeader>
      }
    >
      <Card className="gap-5 p-5">
        <Text variant="small" className="text-text-secondary">
          Pick one only you know, at least {MIN_LENGTH} characters. You&apos;ll use it from now on.
        </Text>

        <Field label="New password" error={localError ?? serverError}>
          <Input
            accessibilityLabel="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoFocus
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
        </Field>
        <Field label="Confirm new password">
          <Input
            accessibilityLabel="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
        </Field>

        <View className="gap-3">
          <Button
            label="Save and sign in"
            size="lg"
            block
            loading={mutation.isPending}
            disabled={!password || !confirm || mutation.isPending}
            onPress={submit}
          />
          <Button label="Back to sign in" variant="ghost" block onPress={giveUp} />
        </View>
      </Card>
    </Screen>
  );
}
