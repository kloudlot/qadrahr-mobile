import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, Switch, View } from "react-native";
import { BellOff, BellRing } from "lucide-react-native";

import { ErrorView } from "@/components/state/StateViews";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/Header";
import { Divider, ListCard, ListRow, Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import {
  pushPermission,
  registerForPush,
  type PushPermission,
} from "@/lib/push";
import {
  mutedAfter,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/queries/notifications";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * What reaches this phone.
 *
 * Two separate gates, shown separately because they are fixed in
 * different places: the phone's own permission (only the system settings
 * can undo a refusal) and the person's choices, which are stored on the
 * server and decide what is sent at all. The notifications list in the
 * app is unaffected by either — it is the record.
 */
export default function NotificationSettingsScreen() {
  const preferences = useNotificationPreferences();

  return (
    <Screen
      header={
        <ScreenHeader
          title="Notification settings"
          subtitle="What reaches this phone"
        />
      }
      refreshing={preferences.isRefetching}
      onRefresh={() => void preferences.refetch()}
    >
      <View className="gap-6 pt-2">
        <PermissionCard />

        {preferences.isLoading ? (
          <SkeletonList rows={4} />
        ) : preferences.error || !preferences.data ? (
          <ErrorView
            message={errorMessage(preferences.error)}
            onRetry={() => void preferences.refetch()}
          />
        ) : (
          <Choices preferences={preferences.data} />
        )}

        <Text variant="caption" className="px-1 text-text-secondary">
          Everything still appears in Notifications in the app, whatever you
          choose here.
        </Text>
      </View>
    </Screen>
  );
}

/**
 * The phone's own permission. Re-read when the app comes back from the
 * system settings, so turning it on there shows here at once.
 */
function PermissionCard() {
  const colors = useThemeColors();
  const [permission, setPermission] = useState<PushPermission | null>(null);

  const refresh = useCallback(() => {
    void pushPermission().then(setPermission);
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  if (permission === null || permission === "granted") return null;

  const turnOn = async () => {
    const token = await registerForPush({ prompt: true });
    refresh();
    if (!token) toast.error("Notifications are still off for this app.");
  };

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <BellOff size={20} color={colors.warning} />
        <Text variant="h3" className="flex-1 text-text-primary">
          Notifications are off on this phone
        </Text>
      </View>
      <Text variant="small" className="text-text-body">
        {permission === "denied"
          ? "Turn them on in your phone's settings to hear about approvals, payslips and replies."
          : "Turn them on to hear about approvals, payslips and replies as they happen."}
      </Text>
      {permission === "denied" ? (
        <Button
          label="Open settings"
          onPress={() => void Linking.openSettings()}
        />
      ) : (
        <Button label="Turn on" icon={BellRing} onPress={() => void turnOn()} />
      )}
    </Card>
  );
}

function Choices({ preferences }: { preferences: NotificationPreferences }) {
  const colors = useThemeColors();
  const update = useUpdateNotificationPreferences();
  const { enabled, categories } = preferences.push;

  const save = (body: Parameters<typeof update.mutate>[0]) =>
    update.mutate(body, {
      onError: (error) => toast.error(errorMessage(error)),
    });

  const toggle = (
    value: boolean,
    onChange: (next: boolean) => void,
    label: string,
    disabled = false,
  ) => (
    <Switch
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      accessibilityLabel={label}
      trackColor={{ true: colors.brand, false: colors.borderStrong }}
      thumbColor="#FFFFFF"
    />
  );

  return (
    <>
      <ListCard>
        <ListRow
          icon={BellRing}
          iconTone="warning"
          title="Push notifications"
          subtitle={
            enabled
              ? "On for what you choose below"
              : "Nothing is sent to this phone"
          }
          chevron={false}
          right={toggle(
            enabled,
            (next) => save({ push: { enabled: next } }),
            "Push notifications",
          )}
        />
      </ListCard>

      <Section title="Send me">
        <ListCard>
          {categories.map((category, i) => (
            <View key={category.key}>
              {i > 0 ? <Divider /> : null}
              <ListRow
                title={category.label}
                chevron={false}
                right={toggle(
                  enabled && category.enabled,
                  (next) =>
                    save({
                      push: {
                        muted: mutedAfter(preferences, category.key, next),
                      },
                    }),
                  category.label,
                  !enabled,
                )}
              />
            </View>
          ))}
        </ListCard>
      </Section>
    </>
  );
}
