import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, CalendarRange } from "lucide-react-native";

import { BalanceCard, formatDays } from "@/components/leave/BalanceBar";
import { formatRange, RequestRow } from "@/components/leave/RequestRow";
import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HeroHeader, HeroText } from "@/components/ui/Header";
import { DetailRow, Divider, ListCard, Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { formatDate, isoDate } from "@/lib/format";
import {
  useEntitlements,
  useMyLeaveRequests,
  useWithdrawLeave,
  type LeaveEntitlement,
  type LeaveRequest,
} from "@/lib/queries/leave";

/**
 * My leave — how much have I got, and what happened to what I asked for.
 */
export default function MyLeaveScreen() {
  const queryClient = useQueryClient();
  const year = useMemo(() => new Date().getFullYear(), []);
  const entitlements = useEntitlements(year);
  const requests = useMyLeaveRequests();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const balances = entitlements.data ?? [];
  const today = isoDate(new Date());
  const all = requests.data ?? [];
  // Upcoming is anything still to happen or still being decided.
  const upcoming = all.filter((r) => r.status === "pending" || (r.status === "approved" && r.endDate >= today));
  const past = all.filter((r) => !upcoming.includes(r));
  const shown = tab === "upcoming" ? upcoming : past;

  const refresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["leave"] });
    setRefreshing(false);
  };

  return (
    <>
      <Screen
        tabs
        flush
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        hero={
          <HeroHeader>
            <View className="flex-row items-end justify-between gap-3">
              <View className="flex-1">
                <HeroText variant="h1" className="font-bold">
                  Leave
                </HeroText>
                <HeroText variant="small" muted>
                  {year} balances and requests
                </HeroText>
              </View>
              <Button
                label="Request"
                icon={CalendarPlus}
                variant="secondary"
                onPress={() => router.push("/leave/request")}
              />
            </View>
          </HeroHeader>
        }
      >
        <View className="gap-6">
          {entitlements.isLoading ? (
            <View className="flex-row gap-3 px-screen-x">
              <Skeleton width={172} height={150} radius={16} />
              <Skeleton width={172} height={150} radius={16} />
            </View>
          ) : entitlements.error ? (
            <View className="px-screen-x">
              <ErrorView message={errorMessage(entitlements.error)} onRetry={() => void entitlements.refetch()} />
            </View>
          ) : balances.length === 0 ? (
            <View className="px-screen-x">
              <Card>
                <EmptyView
                  compact
                  icon={CalendarRange}
                  title="No leave balances yet"
                  detail={`Nothing has been set up for ${year}. HR allocates entitlements at the start of the year.`}
                />
              </Card>
            </View>
          ) : (
            // Full-bleed and horizontal: a type per card, swiped through.
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 8 }}
            >
              {balances.map((balance) => (
                <BalanceCard key={balance.leaveTypeId} balance={balance} />
              ))}
            </ScrollView>
          )}

          <Section title="Requests" className="px-screen-x">
            <SegmentedControl
              value={tab}
              onChange={setTab}
              options={[
                { value: "upcoming", label: "Upcoming", count: upcoming.length },
                { value: "past", label: "Past" },
              ]}
            />
            {requests.isLoading ? (
              <SkeletonList rows={3} />
            ) : requests.error ? (
              <ErrorView message={errorMessage(requests.error)} onRetry={() => void requests.refetch()} />
            ) : shown.length === 0 ? (
              <Card>
                <EmptyView
                  compact
                  icon={CalendarRange}
                  title={tab === "upcoming" ? "Nothing coming up" : "Nothing yet"}
                  detail={tab === "upcoming" ? "Leave you request shows here while it's decided." : "Past leave shows here."}
                  action={tab === "upcoming" ? { label: "Request leave", onPress: () => router.push("/leave/request") } : undefined}
                />
              </Card>
            ) : (
              <ListCard>
                {shown.map((request, i) => (
                  <View key={request._id}>
                    {i > 0 ? <Divider /> : null}
                    <RequestRow
                      request={request}
                      typeName={nameFor(balances, request.leaveTypeId)}
                      onPress={() => setSelected(request)}
                    />
                  </View>
                ))}
              </ListCard>
            )}
          </Section>
        </View>
      </Screen>

      <RequestSheet
        request={selected}
        typeName={selected ? nameFor(balances, selected.leaveTypeId) : ""}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function RequestSheet({
  request,
  typeName,
  onClose,
}: {
  request: LeaveRequest | null;
  typeName: string;
  onClose: () => void;
}) {
  const withdraw = useWithdrawLeave();

  return (
    <Sheet
      visible={Boolean(request)}
      onClose={onClose}
      dismissable={!withdraw.isPending}
      title={typeName}
      subtitle={request ? formatRange(request.startDate, request.endDate) : undefined}
      footer={
        request?.status === "pending" ? (
          <Button
            label="Withdraw request"
            variant="secondary"
            size="lg"
            block
            loading={withdraw.isPending}
            onPress={() =>
              withdraw.mutate(request._id, {
                onSuccess: () => {
                  toast.success("Request withdrawn", "The days are back in your balance.");
                  onClose();
                },
                onError: (error) => toast.error("Couldn't withdraw it", errorMessage(error)),
              })
            }
          />
        ) : null
      }
    >
      {request ? (
        <View>
          <DetailRow label="Status" value={<StatusBadge status={request.status} />} />
          <DetailRow label="From" value={formatDate(request.startDate)} />
          <DetailRow label="To" value={formatDate(request.endDate)} />
          <DetailRow label="Days" value={formatDays(request.days)} />
          <DetailRow label="Requested" value={formatDate(request.createdAt)} />
          {request.reason ? (
            <View className="gap-1 pt-2">
              <Text variant="small" className="text-text-secondary">
                Reason
              </Text>
              <Text variant="body" className="text-text-primary">
                {request.reason}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}

/**
 * The type's name, from the balances already loaded.
 *
 * A request carries only a `leaveTypeId`, and the balances query has
 * already joined those to names — so this avoids a second lookup for a
 * label. A request for a type with no balance row falls back to "Leave",
 * which is vague but never wrong.
 */
function nameFor(balances: LeaveEntitlement[], leaveTypeId: string): string {
  return balances.find((balance) => balance.leaveTypeId === leaveTypeId)?.name ?? "Leave";
}
