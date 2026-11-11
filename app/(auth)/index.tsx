import { useEffect, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { BriefcaseBusiness, Eye, EyeOff } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { HeroHeader, HeroText } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { forgetTenantAccent, useThemeColors, useThemeStore } from "@/lib/theme/ThemeProvider";
import { PRODUCT_NAME } from "@/lib/env";
import { useRememberedTenant } from "@/lib/rememberedTenant";
import { errorMessage } from "@/lib/api";
import { signIn } from "@/lib/session";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Sign in. Screen 01 of the mobile set.
 *
 * No tenant field. The backend resolves the tenant from the email through
 * its global user index, so asking an employee which company database they
 * are in would be asking them to know something they have no way to know.
 *
 * What the phone remembers instead is the organisation and email it last
 * signed in with (lib/rememberedTenant.ts): the screen opens in the
 * employer's name, logo and colour with the email filled in, and "Not
 * you?" forgets both.
 */
export default function SignInScreen() {
  // Null until the employee types: until then the field shows the
  // remembered email, which may arrive a moment after first render.
  const [typedEmail, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const colors = useThemeColors();
  const ejection = useAuthStore((state) => state.ejection);
  const { remembered, branding, forget } = useRememberedTenant();
  const setAccent = useThemeStore((state) => state.setAccent);
  const email = typedEmail ?? remembered?.email ?? "";

  // The employer's colour, before anyone is signed in.
  useEffect(() => {
    if (branding?.accentColor) setAccent(branding.accentColor);
  }, [branding?.accentColor, setAccent]);

  const notMe = async () => {
    await forget();
    forgetTenantAccent();
    setEmail("");
    setPassword("");
  };

  const mutation = useMutation({
    mutationFn: () => signIn(email.trim(), password),
    onSuccess: (result) => {
      // A signed-in result needs no navigation: `signedIn` flips
      // `hasStoredSession` and Stack.Protected in the root layout
      // resolves the swap in one pass. Only the half-finished case has
      // somewhere to go.
      if (result.status === "mfa_required") {
        setPassword("");
        router.push("/(auth)/mfa");
      }
      if (result.status === "password_change_required") {
        setPassword("");
        router.push("/(auth)/new-password");
      }
    },
  });

  const canSubmit = email.trim().length > 0 && password.length > 0 && !mutation.isPending;

  return (
    <Screen
      hero={
        <HeroHeader bottom={96}>
          <View className="items-center gap-3 pt-10">
            {branding?.logoUrl ? (
              <View className="h-16 max-w-[240px] items-center justify-center rounded-3xl bg-white px-4">
                <Image
                  source={{ uri: branding.logoUrl }}
                  accessibilityLabel={`${branding.name} logo`}
                  resizeMode="contain"
                  style={{ width: 200, height: 48 }}
                />
              </View>
            ) : (
              <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white/20">
                <BriefcaseBusiness size={30} color={colors.onBrand} />
              </View>
            )}
            <HeroText variant="h1" className="text-center font-bold">
              {branding?.name ?? PRODUCT_NAME}
            </HeroText>
            <HeroText variant="small" muted className="text-center">
              {branding ? `Clock in, request leave, see your pay. Powered by ${PRODUCT_NAME}.` : "Clock in, request leave, see your pay."}
            </HeroText>
          </View>
        </HeroHeader>
      }
    >
      <Card className="gap-5 p-5">
        <View className="gap-1">
          <Text variant="h2" className="text-text-primary">
            Sign in
          </Text>
          <Text variant="small" className="text-text-secondary">
            Use the work email your employer set you up with.
          </Text>
        </View>

        {/* Why the last session ended. An employee whose session was taken
            over by a sign-in elsewhere otherwise assumes the app broke. */}
        {ejection ? (
          <View className="rounded-xl bg-warning-subtle p-3">
            <Text variant="small" className="text-warning-ink">
              {ejection === "signed_in_elsewhere"
                ? "You were signed out because your account was used on another device."
                : "Your session expired. Sign in to continue."}
            </Text>
          </View>
        ) : null}

        {/* The label is a real label above the field, never a placeholder:
            a placeholder disappears the moment someone types, and screen
            readers get nothing. */}
        <Field label="Work email">
          <Input
            accessibilityLabel="Work email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            placeholder="you@company.com"
          />
        </Field>
        <Field label="Password" error={mutation.isError ? errorMessage(mutation.error) : null}>
          <View>
            <Input
              accessibilityLabel="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              onSubmitEditing={() => canSubmit && mutation.mutate()}
              returnKeyType="go"
              className="pr-12"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              onPress={() => setShowPassword((s) => !s)}
              hitSlop={8}
              className="absolute bottom-0 right-3 top-0 justify-center"
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.textSecondary} />
              ) : (
                <Eye size={20} color={colors.textSecondary} />
              )}
            </Pressable>
          </View>
        </Field>

        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: "/(auth)/forgot", params: { email: email.trim() } })}
          hitSlop={8}
          className="-mt-2 self-end"
        >
          <Text variant="small" className="font-semibold text-brand">
            Forgot password?
          </Text>
        </Pressable>

        <Button
          label="Sign in"
          size="lg"
          block
          loading={mutation.isPending}
          disabled={!canSubmit}
          onPress={() => mutation.mutate()}
        />

        {remembered ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Not you? Sign in with a different account"
            onPress={notMe}
            hitSlop={8}
            className="self-center"
          >
            <Text variant="small" className="text-text-secondary">
              Not you? <Text variant="small" className="font-semibold text-brand">Use a different account</Text>
            </Text>
          </Pressable>
        ) : null}
      </Card>
    </Screen>
  );
}
