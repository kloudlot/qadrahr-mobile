import { useMemo, useState } from "react";
import { View } from "react-native";
import { History } from "lucide-react-native";

import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "@/components/state/StateViews";
import { Card } from "@/components/ui/Card";
import { Field, Select } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import { DetailRow, Section } from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { errorMessage } from "@/lib/api";
import { formatMoney, useMyCompany } from "@/lib/queries/company";
import { addMonths } from "@/lib/queries/loans";
import { useEarlierPayslip } from "@/lib/queries/payslips";

/** How far back the month list goes. The old system may hold more; few people look further. */
const MONTHS_BACK = 36;

/**
 * Payslips from before the company moved to this system, fetched one
 * month at a time from the old payroll platform. Read-only, and in naira:
 * the old platform only ever paid in naira.
 */
export default function EarlierPayslipScreen() {
  const company = useMyCompany();
  const cutover = company.data?.earlierPayslipsBefore ?? null;
  const [period, setPeriod] = useState<string | null>(null);
  const slip = useEarlierPayslip(period);

  const months = useMemo(
    () =>
      cutover
        ? Array.from({ length: MONTHS_BACK }, (_, i) =>
            addMonths(cutover, -(i + 1)),
          )
        : [],
    [cutover],
  );

  return (
    <Screen
      header={
        <ScreenHeader
          title="Earlier payslips"
          subtitle="From the old payroll system"
        />
      }
    >
      <View className="gap-6 pt-2">
        {company.isLoading ? (
          <LoadingView />
        ) : !cutover ? (
          <EmptyView
            icon={History}
            title="Not available"
            detail="Your company hasn't connected its earlier payroll system."
          />
        ) : (
          <>
            <Field
              label="Month"
              hint={`Payslips before ${monthName(cutover)} are on the old system.`}
            >
              <Select
                title="Month"
                value={period}
                onChange={setPeriod}
                placeholder="Choose a month"
                options={months.map((month) => ({
                  value: month,
                  label: monthName(month),
                }))}
              />
            </Field>

            {!period ? null : slip.isLoading ? (
              <LoadingView label="Asking the old payroll system" />
            ) : slip.error ? (
              <ErrorView message={errorMessage(slip.error)} />
            ) : slip.data ? (
              <View className="gap-6">
                <View className="items-center gap-1 rounded-3xl bg-brand-subtle px-4 py-6">
                  <Text variant="micro" className="text-brand">
                    Net pay
                  </Text>
                  <Text variant="display" tabular className="text-text-primary">
                    {formatMoney(slip.data.net, company.data?.currency)}
                  </Text>
                  <Text variant="caption" className="text-text-secondary">
                    {monthName(slip.data.period)} · gross{" "}
                    {formatMoney(slip.data.gross, company.data?.currency)}
                  </Text>
                </View>

                <Card padded={false} className="px-4 py-1">
                  <DetailRow label="Name" value={slip.data.name} />
                  {slip.data.company ? (
                    <DetailRow label="Company" value={slip.data.company} />
                  ) : null}
                  <DetailRow
                    label="Paid into"
                    // The account number arrives already masked to its last four digits.
                    value={
                      [slip.data.bankName, slip.data.accountNumber]
                        .filter(Boolean)
                        .join(" · ") || "—"
                    }
                  />
                  <DetailRow
                    label="Days worked"
                    value={`${slip.data.workDays}${slip.data.absentDays ? ` (${slip.data.absentDays} absent)` : ""}`}
                  />
                </Card>

                <Lines
                  title="Earnings"
                  currency={company.data?.currency}
                  rows={[
                    { label: "Basic salary", amount: slip.data.basic },
                    ...slip.data.earnings,
                  ]}
                />
                <Lines
                  title="Deductions"
                  currency={company.data?.currency}
                  rows={slip.data.deductions}
                />
              </View>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

function Lines({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: { label: string; amount: number }[];
  currency: string | undefined;
}) {
  if (!rows.length) return null;
  return (
    <Section title={title}>
      <Card padded={false} className="px-4 py-1">
        {rows.map((row) => (
          <DetailRow
            key={row.label}
            label={row.label}
            value={formatMoney(row.amount, currency)}
          />
        ))}
      </Card>
    </Section>
  );
}

/** `2026-03` → `March 2026`. */
function monthName(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, 1).toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
}
