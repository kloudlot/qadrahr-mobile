import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Megaphone, Pin } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Badge } from "@/components/ui/Badge";
import { ScreenHeader } from "@/components/ui/Header";
import { Divider, ListCard } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { useAnnouncements, type Announcement } from "@/lib/queries/broadcasts";

/** Notices from the organisation: pinned first, then newest. */
export default function AnnouncementsScreen() {
  const feed = useAnnouncements();
  const rows = feed.data ?? [];
  const unread = rows.filter((r) => !r.readAt).length;

  return (
    <Screen
      header={<ScreenHeader title="Announcements" subtitle={unread > 0 ? `${unread} unread` : undefined} />}
      refreshing={feed.isRefetching}
      onRefresh={() => void feed.refetch()}
    >
      <View className="pt-2">
        {feed.isLoading ? (
          <SkeletonList rows={4} />
        ) : feed.error ? (
          <ErrorView message={errorMessage(feed.error)} onRetry={() => void feed.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyView icon={Megaphone} title="Nothing yet" detail="Announcements from your organisation will appear here." />
        ) : (
          <ListCard>
            {rows.map((row, i) => (
              <View key={row._id}>
                {i > 0 ? <Divider inset={36} /> : null}
                <AnnouncementRow announcement={row} onPress={() => router.push(`/announcements/${row._id}`)} />
              </View>
            ))}
          </ListCard>
        )}
      </View>
    </Screen>
  );
}

function AnnouncementRow({ announcement: a, onPress }: { announcement: Announcement; onPress: () => void }) {
  const colors = useThemeColors();
  const unread = !a.readAt;
  const toConfirm = a.requiresAcknowledgement && !a.acknowledgedAt;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={cn("flex-row gap-3 px-4 py-3.5 active:bg-bg-inset", a.pinned && "bg-brand-subtle/40")}>
      <View className="w-2 pt-2">{unread ? <View className="h-2 w-2 rounded-full bg-brand" /> : null}</View>
      <View className="flex-1 gap-1">
        <View className="flex-row flex-wrap items-center gap-2">
          {a.pinned ? <Pin size={14} color={colors.brand} /> : null}
          <Text variant="body" className={unread ? "font-semibold text-text-primary" : "text-text-primary"}>
            {a.title}
          </Text>
        </View>
        <Text variant="small" numberOfLines={2} className="text-text-secondary">
          {a.body}
        </Text>
        <View className="flex-row flex-wrap items-center gap-2">
          <Text variant="caption" className="text-text-disabled">
            {a.from} · {relativeTime(a.sentAt)}
          </Text>
          {toConfirm ? <Badge tone="warning">Please confirm</Badge> : null}
        </View>
      </View>
    </Pressable>
  );
}
