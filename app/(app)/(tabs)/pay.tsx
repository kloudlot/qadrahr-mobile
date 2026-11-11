import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { FileDown, History, ReceiptText, Wallet } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HeroHeader, HeroText } from "@/components/ui/Header";
import { Divider, ListCard, ListRow, Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { formatPeriod, useOpenPayslip } from "@/components/pay/payslipActions";
import { errorMessage } from "@/lib/api";
import { formatMoney, useMyCompany } from "@/lib/queries/company";
import { useMyPayslips, type Payslip } from "@/lib/queries/payslips";

/**
 * Pay — the latest payslip up front, and every earlier one a tap away.
 *
 * Read-only, and deliberately so: running, previewing or approving
 * payroll never happens on mobile.
 */
export default function PayScreen() {
  const queryClient = useQueryClient();
  const payslips = useMyPayslips();
  const company = useMyCompany();
  const [refreshing, setRefreshing] = useState(false);

  const all = payslips.data ?? [];
  const latest = all[0];
  // Set when the company's payslips before moving here can be read from its old payroll system.
  const earlier = company.data?.earlierPayslipsBefore ? (
    <ListCard>
      <ListRow
        icon={History}
        iconTone="neutral"
        title="Earlier payslips"
        subtitle="From the old payroll system"
        onPress={() => router.push("/pay/earlier")}
      />
    </ListCard>
  ) : null;

  const refresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["payslips"] });
    setRefreshing(false);
  };

  return (
    <Screen
      tabs
      refreshing={refreshing}
      onRefresh={() => void refresh()}
      hero={
        <HeroHeader>
          <HeroText variant="small" muted>
            {latest ? `${formatPeriod(latest)} · net pay` : "Pay"}
          </HeroText>
          {payslips.isLoading ? (
            <View className="mt-2">
              <Skeleton width={200} height={40} />
            </View>
          ) : (
            <HeroText variant="display" className="mt-1">
              {latest ? formatMoney(latest.netPay, latest.currency) : "—"}
            </HeroText>
          )}
        </HeroHeader>
      }
    >
      {payslips.isLoading ? (
        <SkeletonList rows={4} />
      ) : payslips.error ? (
        <ErrorView message={errorMessage(payslips.error)} onRetry={() => void payslips.refetch()} />
      ) : !latest ? (
        <View className="gap-6">
          <Card>
            <EmptyView
              compact
              icon={Wallet}
              title="No payslips yet"
              detail="Your first payslip appears here once a payroll run including you is locked."
            />
          </Card>
          {earlier}
        </View>
      ) : (
        <View className="gap-6">
          <LatestCard payslip={latest} />

          {all.length > 1 ? (
            <Section title="Earlier payslips">
              <ListCard>
                {all.slice(1).map((payslip, i) => (
                  <View key={payslip._id}>
                    {i > 0 ? <Divider inset={68} /> : null}
                    <ListRow
                      icon={ReceiptText}
                      iconTone="success"
                      title={formatPeriod(payslip)}
                      subtitle={`Gross ${formatMoney(payslip.gross, payslip.currency)}`}
                      right={
                        <Text variant="body" tabular className="font-semibold text-text-primary">
                          {formatMoney(payslip.netPay, payslip.currency)}
                        </Text>
                      }
                      onPress={() => router.push({ pathname: "/pay/[id]", params: { id: payslip._id } })}
                    />
                  </View>
                ))}
              </ListCard>
            </Section>
          ) : null}

          {earlier}
        </View>
      )}
    </Screen>
  );
}

function LatestCard({ payslip }: { payslip: Payslip }) {
  const download = useOpenPayslip();
  return (
    <Card className="gap-4">
      <View className="flex-row">
        <Figure label="Gross" value={formatMoney(payslip.gross, payslip.currency)} />
        <Figure label="Deductions" value={formatMoney(payslip.totalDeductions, payslip.currency)} />
        <Figure label="Tax" value={formatMoney(payslip.totalTax, payslip.currency)} />
      </View>
      <View className="flex-row gap-3">
        <Button
          label="View details"
          variant="soft"
          className="flex-1"
          onPress={() => router.push({ pathname: "/pay/[id]", params: { id: payslip._id } })}
        />
        <Button
          label="PDF"
          icon={FileDown}
          variant="secondary"
          loading={download.isPending}
          onPress={() => download.open(payslip._id)}
        />
      </View>
    </Card>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-0.5">
      <Text variant="caption" className="text-text-secondary">
        {label}
      </Text>
      <Text variant="small" tabular numberOfLines={1} adjustsFontSizeToFit className="font-semibold text-text-primary">
        {value}
      </Text>
    </View>
  );
}
