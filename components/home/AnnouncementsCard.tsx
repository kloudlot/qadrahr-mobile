import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Megaphone, Pin } from "lucide-react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/List";
import { Text } from "@/components/ui/Text";
import { useAnnouncements } from "@/lib/queries/broadcasts";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

/**
 * The latest announcement on Home: a pinned one, else anything unread.
 * Nothing at all when there's nothing new — or when the organisation
 * doesn't use broadcasts — so Home stays quiet.
 */
export function AnnouncementsCard() {
  const colors = useThemeColors();
  const feed = useAnnouncements();
  const rows = feed.data ?? [];
  const lead = rows.find((r) => r.pinned) ?? rows.find((r) => !r.readAt);
  if (!lead) return null;

  const unread = rows.filter((r) => !r.readAt).length;
  return (
    <Section title="Announcements" action="All" onAction={() => router.push("/announcements")}>
      <Pressable accessibilityRole="button" onPress={() => router.push(`/announcements/${lead._id}`)}>
        <Card className="flex-row gap-3 p-4">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-subtle">
            {lead.pinned ? <Pin size={18} color={colors.brand} /> : <Megaphone size={18} color={colors.brand} />}
          </View>
          <View className="flex-1 gap-1">
            <Text variant="body" className={lead.readAt ? "text-text-primary" : "font-semibold text-text-primary"}>
              {lead.title}
            </Text>
            <Text variant="small" numberOfLines={2} className="text-text-secondary">
              {lead.body}
            </Text>
            <View className="flex-row flex-wrap gap-2 pt-0.5">
              {lead.requiresAcknowledgement && !lead.acknowledgedAt ? <Badge tone="warning">Please confirm</Badge> : null}
              {unread > 1 ? <Badge tone="info">{`${unread} unread`}</Badge> : null}
            </View>
          </View>
        </Card>
      </Pressable>
    </Section>
  );
}
