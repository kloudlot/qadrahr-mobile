import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { ClipboardList } from "lucide-react-native";

import { detailFor, iconFor, whereIsIt } from "@/components/requests/describe";
import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { StatusBadge } from "@/components/ui/Badge";
import { ScreenHeader } from "@/components/ui/Header";
import { Divider, ListCard, ListRow } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SkeletonList } from "@/components/ui/Skeleton";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { describeSubject } from "@/lib/queries/approvals";
import { useMyRequests } from "@/lib/queries/requests";

const OPEN = new Set(["pending", "returned", "blocked"]);

/** Everything I've asked for — from every module — and where each one is. */
export default function MyRequestsScreen() {
  const requests = useMyRequests();
  const [tab, setTab] = useState<"open" | "closed">("open");

  const all = requests.data ?? [];
  const open = all.filter((r) => OPEN.has(r.state));
  const shown = tab === "open" ? open : all.filter((r) => !OPEN.has(r.state));

  return (
    <Screen
      header={<ScreenHeader title="My requests" subtitle="Leave, corrections, changes and more" />}
      refreshing={requests.isRefetching}
      onRefresh={() => void requests.refetch()}
    >
      <View className="gap-4 pt-2">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "open", label: "Open", count: open.length },
            { value: "closed", label: "Closed" },
          ]}
        />
        {requests.isLoading ? (
          <SkeletonList rows={5} />
        ) : requests.error ? (
          <ErrorView message={errorMessage(requests.error)} onRetry={() => void requests.refetch()} />
        ) : shown.length === 0 ? (
          <EmptyView
            icon={ClipboardList}
            title={tab === "open" ? "Nothing waiting" : "Nothing yet"}
            detail={tab === "open" ? "Requests you raise show here until they're decided." : "Decided requests show here."}
          />
        ) : (
          <ListCard>
            {shown.map((item, i) => (
              <View key={item._id}>
                {i > 0 ? <Divider inset={68} /> : null}
                <ListRow
                  icon={iconFor(item.subjectType)}
                  iconTone={item.state === "returned" ? "warning" : "brand"}
                  title={describeSubject(item.subjectType)}
                  subtitle={[detailFor(item), OPEN.has(item.state) ? whereIsIt(item) : formatDate(item.createdAt)]
                    .filter(Boolean)
                    .join(" · ")}
                  right={<StatusBadge status={item.state} />}
                  onPress={() => router.push({ pathname: "/requests/[id]", params: { id: item._id } })}
                />
              </View>
            ))}
          </ListCard>
        )}
      </View>
    </Screen>
  );
}
