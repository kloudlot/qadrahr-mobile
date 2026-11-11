import { View } from "react-native";
import { BookOpen } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { ScreenHeader } from "@/components/ui/Header";
import { Divider, ListCard, ListRow } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api";
import { formatDate, isoDate } from "@/lib/format";
import { addDays } from "@/lib/queries/attendance";
import { useMyLearning, type Enrolment } from "@/lib/queries/people";

/** Within this many days, an expiry is worth flagging: there's still time to renew. */
const EXPIRING_DAYS = 30;

/** My courses and certifications, and when any lapse. */
export default function LearningScreen() {
  const learning = useMyLearning();
  const today = isoDate(new Date());
  const soon = addDays(today, EXPIRING_DAYS);

  return (
    <Screen
      header={<ScreenHeader title="My learning" subtitle="Courses, certifications and when they expire" />}
      refreshing={learning.isRefetching}
      onRefresh={() => void learning.refetch()}
    >
      <View className="pt-2">
        {learning.isLoading ? (
          <SkeletonList rows={4} />
        ) : learning.error ? (
          <ErrorView message={errorMessage(learning.error)} onRetry={() => void learning.refetch()} />
        ) : !learning.data?.length ? (
          <EmptyView icon={BookOpen} title="Nothing assigned yet" detail="Courses HR enrols you on appear here." />
        ) : (
          <ListCard>
            {learning.data.map((row, i) => (
              <View key={row._id}>
                {i > 0 ? <Divider inset={68} /> : null}
                <ListRow
                  icon={BookOpen}
                  iconTone="info"
                  chevron={false}
                  title={row.learningItemName ?? "Course"}
                  subtitle={describe(row)}
                  right={expiryBadge(row, today, soon) ?? <StatusBadge status={row.status} />}
                />
              </View>
            ))}
          </ListCard>
        )}
      </View>
    </Screen>
  );
}

function describe(row: Enrolment): string {
  if (row.expiresOn) return `${row.completedOn ? `Completed ${formatDate(row.completedOn)} · ` : ""}expires ${formatDate(row.expiresOn)}`;
  if (row.completedOn) return `Completed ${formatDate(row.completedOn)}`;
  return row.enrolledOn ? `Enrolled ${formatDate(row.enrolledOn)}` : "Enrolled";
}

/** Only for something completed, where the expiry is the thing to act on. Calendar dates compare as strings. */
function expiryBadge(row: Enrolment, today: string, soon: string) {
  if (row.status !== "completed" || !row.expiresOn) return null;
  const expires = row.expiresOn.slice(0, 10);
  if (expires < today) return <Badge tone="danger">Expired</Badge>;
  if (expires <= soon) return <Badge tone="warning">Expiring</Badge>;
  return null;
}
