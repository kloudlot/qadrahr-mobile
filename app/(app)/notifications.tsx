import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { BellOff, CheckCheck, Settings2 } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Divider, ListCard } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { relativeTime } from "@/lib/format";
import { notificationTarget } from "@/lib/notificationTarget";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  type AppNotification,
} from "@/lib/queries/notifications";

/**
 * Notifications — a feed, newest first, unread in bold with a dot.
 *
 * Tapping marks read and takes the employee to whatever the notification
 * is about: it "lands in context", which is the whole point — a
 * notification that opens a list they then have to search is one that
 * wasted their time.
 */
export default function NotificationsScreen() {
  const notifications = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const colors = useThemeColors();

  const rows = notifications.data?.data ?? [];
  const unread = rows.filter((row) => !row.readAt).length;

  return (
    <Screen
      header={
        <ScreenHeader
          title="Notifications"
          subtitle={unread > 0 ? `${unread} unread` : undefined}
          right={
            <View className="flex-row items-center gap-1">
              {unread > 0 ? (
                <Button label="Read all" icon={CheckCheck} variant="ghost" onPress={() => markAllRead.mutate()} />
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notification settings"
                hitSlop={12}
                className="p-2"
                onPress={() => router.push("/notification-settings")}
              >
                <Settings2 size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
          }
        />
      }
      refreshing={notifications.isRefetching}
      onRefresh={() => void notifications.refetch()}
    >
      <View className="pt-2">
        {notifications.isLoading ? (
          <SkeletonList rows={5} />
        ) : notifications.error ? (
          <ErrorView message={errorMessage(notifications.error)} onRetry={() => void notifications.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyView icon={BellOff} title="Nothing yet" detail="Approvals, payslips and clock reminders will appear here." />
        ) : (
          <ListCard>
            {rows.map((row, i) => (
              <View key={row._id}>
                {i > 0 ? <Divider inset={36} /> : null}
                <NotificationRow
                  notification={row}
                  onPress={() => {
                    if (!row.readAt) markRead.mutate(row._id);
                    const target = notificationTarget(row);
                    if (target) router.push(target);
                  }}
                />
              </View>
            ))}
          </ListCard>
        )}
      </View>
    </Screen>
  );
}

function NotificationRow({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
  const unread = !notification.readAt;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={cn("flex-row gap-3 px-4 py-3.5 active:bg-bg-inset", unread && "bg-brand-subtle/40")}>
      {/* The dot occupies its slot whether or not it is shown, so rows do
          not shift left as they are read. */}
      <View className="w-2 pt-2">{unread ? <View className={`h-2 w-2 rounded-full ${toneFor(notification)}`} /> : null}</View>
      <View className="flex-1 gap-0.5">
        <Text variant="body" className={unread ? "font-semibold text-text-primary" : "text-text-primary"}>
          {notification.title}
        </Text>
        <Text variant="small" className="text-text-secondary">
          {notification.body}
        </Text>
        <Text variant="caption" className="text-text-disabled">
          {relativeTime(notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Blue for information, amber where the employee has to do something.
 *
 * Driven off the notification `type`, which is the raising module's
 * string. An unrecognised type is treated as information rather than
 * action — over-signalling trains people to ignore the dot.
 */
function toneFor(notification: AppNotification): string {
  const ACTION = ["approval.pending", "policy.acknowledgement_due", "attendance.missing_punch", "broadcast.reminder"];
  return ACTION.includes(notification.type) ? "bg-warning" : "bg-brand";
}

