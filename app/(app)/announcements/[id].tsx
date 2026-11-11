import { useEffect } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";

import { ErrorView, LoadingView } from "@/components/state/StateViews";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import { useAcknowledgeAnnouncement, useAnnouncements, useMarkAnnouncementRead } from "@/lib/queries/broadcasts";

/** One announcement. Opening it counts as reading it. */
export default function AnnouncementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const feed = useAnnouncements();
  const read = useMarkAnnouncementRead();
  const acknowledge = useAcknowledgeAnnouncement();
  const item = feed.data?.find((a) => a._id === id);

  const { mutate } = read;
  useEffect(() => {
    if (item && !item.readAt) mutate(item._id);
  }, [item, mutate]);

  if (feed.isLoading) return <LoadingView />;
  if (feed.error || !item) {
    return (
      <Screen header={<ScreenHeader title="Announcement" />}>
        <ErrorView message={feed.error ? errorMessage(feed.error) : "This announcement isn't available."} onRetry={() => void feed.refetch()} />
      </Screen>
    );
  }

  const needsConfirm = item.requiresAcknowledgement && !item.acknowledgedAt;
  return (
    <Screen header={<ScreenHeader title="Announcement" />}>
      <View className="gap-4 pt-2">
        <Card className="gap-3 p-5">
          <Text variant="h2" className="text-text-primary">
            {item.title}
          </Text>
          <Text variant="caption" className="text-text-disabled">
            {item.from} · {new Date(item.sentAt).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </Text>
          <Text variant="body" className="leading-6 text-text-primary">
            {item.body}
          </Text>
        </Card>

        {needsConfirm ? (
          <Button
            label="I've read this"
            icon={CheckCircle2}
            size="lg"
            block
            loading={acknowledge.isPending}
            onPress={() =>
              acknowledge.mutate(item._id, {
                onSuccess: () => toast.success("Thanks — confirmed"),
                onError: (e) => toast.error("That didn't go through", errorMessage(e)),
              })
            }
          />
        ) : item.acknowledgedAt ? (
          <View className="flex-row items-center justify-center gap-2">
            <CheckCircle2 size={16} color={colors.success} />
            <Text variant="small" className="text-success-ink">
              You confirmed you&apos;ve read this.
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
