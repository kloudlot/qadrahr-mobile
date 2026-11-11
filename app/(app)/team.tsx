import { Linking, View } from "react-native";
import { Mail, Phone, Users } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useMyTeam, type TeamMember } from "@/lib/queries/people";

/**
 * The people who report to me, and a way to reach each. The API strips
 * anything sensitive (pay, bank, IDs) before it gets here.
 */
export default function TeamScreen() {
  const team = useMyTeam();

  return (
    <Screen
      header={<ScreenHeader title="My team" subtitle="The people who report to you" />}
      refreshing={team.isRefetching}
      onRefresh={() => void team.refetch()}
    >
      <View className="gap-3 pt-2">
        {team.isLoading ? (
          <SkeletonList rows={4} />
        ) : team.error ? (
          <ErrorView message={errorMessage(team.error)} onRetry={() => void team.refetch()} />
        ) : !team.data?.length ? (
          <EmptyView
            icon={Users}
            title="No direct reports"
            detail="Nobody reports to you. If that's wrong, ask HR to update the reporting line."
          />
        ) : (
          team.data.map((member) => <MemberCard key={member._id} member={member} />)
        )}
      </View>
    </Screen>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ");
  return (
    <Card className="flex-row items-center gap-3">
      <Avatar name={name} size={44} />
      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="body" numberOfLines={1} className="font-semibold text-text-primary">
          {name}
        </Text>
        <Text variant="caption" numberOfLines={1} className="text-text-secondary">
          {member.employeeNumber} · since {formatDate(member.hireDate)}
        </Text>
        {member.status !== "active" ? <StatusBadge status={member.status} className="mt-1" /> : null}
      </View>
      {member.phone ? (
        <IconButton icon={Phone} label={`Call ${name}`} onPress={() => void Linking.openURL(`tel:${member.phone}`)} />
      ) : null}
      {member.workEmail ? (
        <IconButton icon={Mail} label={`Email ${name}`} onPress={() => void Linking.openURL(`mailto:${member.workEmail}`)} />
      ) : null}
    </Card>
  );
}
