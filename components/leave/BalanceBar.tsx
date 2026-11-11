import { View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import type { LeaveEntitlement } from "@/lib/queries/leave";

/**
 * One leave type's balance, as a card in the Leave tab's carousel.
 *
 * Taken and pending are drawn separately on the bar, because "I have 12
 * days" and "I have 12 days, 3 of which are waiting on my manager" are
 * different answers to "can I book the week after next?".
 */
export function BalanceCard({ balance }: { balance: LeaveEntitlement }) {
  const unlimited = balance.entitled <= 0;
  const takenPct = unlimited ? 0 : clamp((balance.taken / balance.entitled) * 100);
  const pendingPct = unlimited ? 0 : clamp((balance.pending / balance.entitled) * 100);

  return (
    <Card className="w-[172px] gap-3">
      <Text variant="small" numberOfLines={1} className="font-medium text-text-secondary">
        {balance.name}
      </Text>
      {unlimited ? (
        <Text variant="h2" className="text-text-primary">
          On request
        </Text>
      ) : (
        <View className="flex-row items-baseline gap-1">
          <Text tabular className="font-bold text-text-primary" style={{ fontSize: 32, lineHeight: 38 }}>
            {formatNumber(balance.available)}
          </Text>
          <Text variant="small" tabular className="text-text-secondary">
            / {formatNumber(balance.entitled)} days
          </Text>
        </View>
      )}
      {unlimited ? null : (
        <View className="h-2 w-full flex-row overflow-hidden rounded-full bg-bg-inset">
          <View className="h-full bg-brand" style={{ width: `${takenPct}%` }} />
          <View className="h-full bg-warning" style={{ width: `${pendingPct}%` }} />
        </View>
      )}
      <Text variant="caption" numberOfLines={1} className={balance.pending > 0 ? "text-warning-ink" : "text-text-secondary"}>
        {balance.pending > 0 ? `${formatDays(balance.pending)} pending` : `${formatDays(balance.taken)} taken`}
      </Text>
    </Card>
  );
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

/** Half-day precision: 2.5, never 2.4999. */
function formatNumber(days: number): string {
  const rounded = Math.round(days * 2) / 2;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatDays(days: number): string {
  const rounded = Math.round(days * 2) / 2;
  return `${formatNumber(days)} ${rounded === 1 ? "day" : "days"}`;
}
