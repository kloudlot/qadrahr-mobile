import { useState } from "react";
import { View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { KeyRound, MailCheck } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { HeroHeader, HeroText } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { errorMessage, http } from "@/lib/api";

/**
 * Forgot password. Asks the server to email a reset link.
 *
 * The link opens the web console, where the new password is chosen — one
 * page for every client rather than a copy per app. The answer here is the
 * same whether or not the address has an account; the server says nothing
 * either way, so neither does this screen.
 */
export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const colors = useThemeColors();

  const mutation = useMutation({
    mutationFn: () => http.post("/auth/forgot-password", { email: email.trim() }),
  });

  const valid = /\S+@\S+\.\S+/.test(email.trim());

  return (
    <Screen
      hero={
        <HeroHeader bottom={96}>
          <View className="items-center gap-3 pt-10">
            <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white/20">
              {mutation.isSuccess ? (
                <MailCheck size={30} color={colors.onBrand} />
              ) : (
                <KeyRound size={30} color={colors.onBrand} />
              )}
            </View>
            <HeroText variant="h1" className="font-bold">
              {mutation.isSuccess ? "Check your email" : "Forgot password"}
            </HeroText>
          </View>
        </HeroHeader>
      }
    >
      <Card className="gap-5 p-5">
        {mutation.isSuccess ? (
          <>
            <Text variant="body" className="text-text-primary">
              If {email.trim()} has an account, a link to reset its password is on its way. It works once and lasts an
              hour.
            </Text>
            <Text variant="small" className="text-text-secondary">
              Open the link, choose a new password, then come back and sign in. Nothing after a few minutes? Check spam.
            </Text>
            <Button label="Back to sign in" size="lg" block onPress={() => router.back()} />
          </>
        ) : (
          <>
            <Text variant="small" className="text-text-secondary">
              Enter your work email and we&apos;ll send you a link to choose a new password.
            </Text>
            <Field label="Work email" error={mutation.isError ? errorMessage(mutation.error) : null}>
              <Input
                accessibilityLabel="Work email"
                value={email}
                onChangeText={setEmail}
                autoFocus
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
                returnKeyType="send"
                onSubmitEditing={() => valid && mutation.mutate()}
                placeholder="you@company.com"
              />
            </Field>
            <View className="gap-3">
              <Button
                label="Email me a reset link"
                size="lg"
                block
                loading={mutation.isPending}
                disabled={!valid || mutation.isPending}
                onPress={() => mutation.mutate()}
              />
              <Button label="Back to sign in" variant="ghost" block onPress={() => router.back()} />
            </View>
          </>
        )}
      </Card>
    </Screen>
  );
}
