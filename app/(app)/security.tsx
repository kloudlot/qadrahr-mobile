import { useState } from "react";
import { Linking, Share, View } from "react-native";
import { KeyRound, ShieldCheck, ShieldOff } from "lucide-react-native";

import { ErrorView } from "@/components/state/StateViews";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  useDisableMfa,
  useEnableMfa,
  useMfaStatus,
  useStartMfaSetup,
  type MfaSetup,
} from "@/lib/queries/security";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * Two-factor authentication — the same account setting as on the web.
 *
 * On a phone the authenticator is usually on the same phone, so there is
 * no QR code to scan: the setup link opens the authenticator directly,
 * with the key to type as the fallback. The key is selectable but never
 * offered to the share sheet — it is the second factor, and a chat app
 * is the wrong place for it.
 */
export default function SecurityScreen() {
  const status = useMfaStatus();
  const [recovery, setRecovery] = useState<string[] | null>(null);

  return (
    <Screen header={<ScreenHeader title="Security" subtitle="A second step when you sign in" />}>
      <View className="gap-6 pt-2">
        {recovery ? <RecoveryCodes codes={recovery} onDone={() => setRecovery(null)} /> : null}

        {status.isLoading ? (
          <SkeletonList rows={2} />
        ) : status.error || !status.data ? (
          <ErrorView message={errorMessage(status.error)} onRetry={() => void status.refetch()} />
        ) : status.data.enabled ? (
          <TurnOff enabledAt={status.data.enabledAt} remaining={status.data.recoveryCodesRemaining} />
        ) : (
          <SetUp onEnabled={setRecovery} />
        )}
      </View>
    </Screen>
  );
}

function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  return (
    <Card className="gap-3">
      <Text variant="h3" className="text-text-primary">
        Save your recovery codes
      </Text>
      <Text variant="small" className="text-text-body">
        Each one signs you in once if you lose this phone. They are shown only now, so keep them somewhere safe, like a
        password manager.
      </Text>
      <View className="flex-row flex-wrap gap-x-6 gap-y-1 rounded-xl bg-bg-inset p-4">
        {codes.map((code) => (
          <Text key={code} variant="body" selectable tabular className="w-[40%] text-text-primary">
            {code}
          </Text>
        ))}
      </View>
      <View className="flex-row gap-3">
        <Button
          label="Save to…"
          variant="secondary"
          className="flex-1"
          onPress={() => void Share.share({ message: codes.join("\n") })}
        />
        <Button label="I've saved them" className="flex-1" onPress={onDone} />
      </View>
    </Card>
  );
}

function SetUp({ onEnabled }: { onEnabled: (codes: string[]) => void }) {
  const start = useStartMfaSetup();
  const enable = useEnableMfa();
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [code, setCode] = useState("");

  if (!setup) {
    return (
      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <Badge tone="neutral">Off</Badge>
          <Text variant="small" className="flex-1 text-text-secondary">
            Signing in needs only your password.
          </Text>
        </View>
        <Button
          label="Set up two-factor authentication"
          icon={KeyRound}
          loading={start.isPending}
          onPress={() =>
            start.mutate(undefined, {
              onSuccess: setSetup,
              onError: (error) => toast.error("Couldn't start set-up", errorMessage(error)),
            })
          }
        />
      </Card>
    );
  }

  return (
    <Card className="gap-4">
      <Text variant="small" className="text-text-body">
        1. Add this account to your authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…).
      </Text>
      <Button
        label="Open in my authenticator app"
        variant="soft"
        onPress={() =>
          void Linking.openURL(setup.otpauthUrl).catch(() =>
            toast.info("No authenticator app found", "Install one, or type the key below into it."),
          )
        }
      />
      <View className="gap-1">
        <Text variant="caption" className="text-text-secondary">
          Or type this key into the app — press and hold to copy it
        </Text>
        <Text variant="body" selectable tabular className="rounded-xl bg-bg-inset p-3 tracking-widest text-text-primary">
          {setup.secret}
        </Text>
      </View>
      <Field label="2. Enter the 6-digit code the app now shows" error={enable.isError ? errorMessage(enable.error) : null}>
        <Input
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={8}
          placeholder="123456"
        />
      </Field>
      <View className="flex-row gap-3">
        <Button label="Cancel" variant="ghost" onPress={() => setSetup(null)} />
        <Button
          label="Turn on"
          className="flex-1"
          disabled={!code.trim()}
          loading={enable.isPending}
          onPress={() =>
            enable.mutate(code.trim(), {
              onSuccess: (codes) => {
                setSetup(null);
                setCode("");
                onEnabled(codes);
                toast.success("Two-factor authentication is on");
              },
            })
          }
        />
      </View>
    </Card>
  );
}

function TurnOff({ enabledAt, remaining }: { enabledAt: string | null; remaining: number }) {
  const colors = useThemeColors();
  const disable = useDisableMfa();
  const [code, setCode] = useState("");

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-2">
        <ShieldCheck size={18} color={colors.success} />
        <Badge tone="success">On</Badge>
        <Text variant="small" className="flex-1 text-text-secondary">
          {enabledAt ? `Since ${formatDate(enabledAt)} · ` : ""}
          {remaining} recovery {remaining === 1 ? "code" : "codes"} left
        </Text>
      </View>
      <Field label="To turn it off, enter a current code" error={disable.isError ? errorMessage(disable.error) : null}>
        <Input
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={8}
          placeholder="123456"
        />
      </Field>
      <Button
        label="Turn off"
        icon={ShieldOff}
        variant="danger"
        disabled={!code.trim()}
        loading={disable.isPending}
        onPress={() =>
          disable.mutate(code.trim(), {
            onSuccess: () => {
              setCode("");
              toast.success("Two-factor authentication turned off");
            },
          })
        }
      />
    </Card>
  );
}
