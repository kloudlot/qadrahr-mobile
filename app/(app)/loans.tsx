import { useMemo, useState } from "react";
import { amountPlaceholder, decimalsFor } from "@/lib/money";
import { View } from "react-native";
import { Banknote, CheckCircle2, Plus } from "lucide-react-native";

import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/Header";
import {
  DetailRow,
  Divider,
  ListCard,
  ListRow,
  Section,
} from "@/components/ui/List";
import { Screen } from "@/components/ui/Screen";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Sheet } from "@/components/ui/Sheet";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { formatMoney, useMyCompany } from "@/lib/queries/company";
import { parseAmount } from "@/lib/queries/expenses";
import {
  addMonths,
  formatPeriod,
  nextPeriod,
  OPEN_LOAN_STATUSES,
  useApplyForLoan,
  useMyLoans,
  type Loan,
} from "@/lib/queries/loans";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

const TYPE_LABEL: Record<string, string> = {
  loan: "Staff loan",
  salary_advance: "Salary advance",
};

/**
 * Loans and salary advances: what I owe, what each month takes, and
 * asking for one. Repayments come out of payroll, so the schedule is in
 * payroll months.
 */
export default function LoansScreen() {
  const loans = useMyLoans();
  const [selected, setSelected] = useState<Loan | null>(null);
  const [applying, setApplying] = useState(false);

  const rows = loans.data ?? [];
  // The server allows one loan at a time; saying so beats a refusal after the form is filled.
  const open = rows.find((loan) => OPEN_LOAN_STATUSES.includes(loan.status));

  return (
    <>
      <Screen
        header={
          <ScreenHeader
            title="Loans"
            subtitle="Advances and staff loans, repaid from payroll"
          />
        }
        refreshing={loans.isRefetching}
        onRefresh={() => void loans.refetch()}
        footer={
          loans.isSuccess ? (
            open ? (
              <Text variant="small" className="text-center text-text-secondary">
                You can apply again once {open.reference} is settled.
              </Text>
            ) : (
              <Button
                label="Apply for a loan"
                icon={Plus}
                size="lg"
                block
                onPress={() => setApplying(true)}
              />
            )
          ) : null
        }
      >
        <View className="gap-6 pt-2">
          {loans.isLoading ? (
            <SkeletonList rows={3} />
          ) : loans.error ? (
            <ErrorView
              message={errorMessage(loans.error)}
              onRetry={() => void loans.refetch()}
            />
          ) : rows.length === 0 ? (
            <EmptyView
              icon={Banknote}
              title="No loans"
              detail="Apply for a salary advance or a staff loan, and follow its repayments here."
            />
          ) : (
            <>
              {open ? (
                <CurrentLoan loan={open} onPress={() => setSelected(open)} />
              ) : null}
              {rows.some((loan) => loan !== open) ? (
                <Section title={open ? "Earlier" : "Your loans"}>
                  <ListCard>
                    {rows
                      .filter((loan) => loan !== open)
                      .map((loan, i) => (
                        <View key={loan._id}>
                          {i > 0 ? <Divider inset={68} /> : null}
                          <ListRow
                            icon={Banknote}
                            iconTone="neutral"
                            title={`${TYPE_LABEL[loan.loanType] ?? "Loan"} · ${formatMoney(loan.principal, loan.currency)}`}
                            subtitle={`${loan.reference} · applied ${formatDate(loan.createdAt)}`}
                            right={<StatusBadge status={loan.status} />}
                            onPress={() => setSelected(loan)}
                          />
                        </View>
                      ))}
                  </ListCard>
                </Section>
              ) : null}
            </>
          )}
        </View>
      </Screen>

      <ScheduleSheet loan={selected} onClose={() => setSelected(null)} />
      <ApplySheet visible={applying} onClose={() => setApplying(false)} />
    </>
  );
}

function CurrentLoan({ loan, onPress }: { loan: Loan; onPress: () => void }) {
  const next = loan.instalments.find((instalment) => !instalment.paid);
  const paidCount = loan.instalments.filter(
    (instalment) => instalment.paid,
  ).length;
  return (
    <Card
      className="gap-3"
      onPress={onPress}
      accessibilityLabel={`${loan.reference}, see the schedule`}
    >
      <View className="flex-row items-center justify-between">
        <Text variant="micro" className="text-text-secondary">
          {TYPE_LABEL[loan.loanType] ?? "Loan"} · {loan.reference}
        </Text>
        <StatusBadge status={loan.status} />
      </View>
      <View>
        <Text variant="h1" tabular className="text-text-primary">
          {formatMoney(
            loan.status === "pending" ? loan.principal : loan.outstanding,
            loan.currency,
          )}
        </Text>
        <Text variant="caption" className="text-text-secondary">
          {loan.status === "pending"
            ? "Requested — waiting for approval"
            : "Still to repay"}
        </Text>
      </View>
      {loan.status !== "pending" && loan.instalments.length > 0 ? (
        <>
          <View className="h-1.5 overflow-hidden rounded-pill bg-bg-inset">
            <View
              className="h-full rounded-pill bg-brand"
              style={{
                width: `${Math.round((paidCount / loan.instalments.length) * 100)}%`,
              }}
            />
          </View>
          <Text variant="small" className="text-text-secondary">
            {paidCount} of {loan.instalments.length} repayments made
            {next
              ? ` · next ${formatMoney(next.total, loan.currency)} in ${formatPeriod(next.period)}`
              : ""}
          </Text>
        </>
      ) : null}
      <Text variant="small" className="font-semibold text-brand">
        See the schedule
      </Text>
    </Card>
  );
}

function ScheduleSheet({
  loan,
  onClose,
}: {
  loan: Loan | null;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Sheet
      visible={Boolean(loan)}
      onClose={onClose}
      title={
        loan
          ? `${TYPE_LABEL[loan.loanType] ?? "Loan"} · ${loan.reference}`
          : undefined
      }
      subtitle={loan?.purpose}
    >
      {loan ? (
        <View className="gap-4">
          <View>
            <DetailRow
              label="Status"
              value={<StatusBadge status={loan.status} />}
            />
            <DetailRow
              label="Borrowed"
              value={formatMoney(loan.principal, loan.currency)}
            />
            <DetailRow
              label="Interest"
              value={formatMoney(loan.totalInterest, loan.currency)}
            />
            <DetailRow
              label="Total to repay"
              value={formatMoney(loan.totalRepayable, loan.currency)}
            />
            <DetailRow
              label="Still to repay"
              value={formatMoney(loan.outstanding, loan.currency)}
            />
            <DetailRow
              label="Term"
              value={`${loan.termMonths} ${loan.termMonths === 1 ? "month" : "months"}`}
            />
            {loan.settledAt ? (
              <DetailRow label="Settled" value={formatDate(loan.settledAt)} />
            ) : null}
          </View>

          {loan.note ? (
            <Text
              variant="small"
              className="rounded-xl bg-bg-inset px-3 py-2.5 text-text-body"
            >
              {loan.note}
            </Text>
          ) : null}

          <Text variant="small" className="font-semibold text-text-label">
            Repayments
          </Text>
          {loan.instalments.length === 0 ? (
            <Text variant="small" className="text-text-secondary">
              The schedule is set once the loan is approved.
            </Text>
          ) : (
            <View className="gap-0">
              {loan.instalments.map((instalment) => (
                <View
                  key={instalment.number}
                  className="flex-row items-center gap-3 border-b border-border py-2.5"
                >
                  <Text
                    variant="small"
                    tabular
                    className="w-6 text-text-secondary"
                  >
                    {instalment.number}
                  </Text>
                  <View className="flex-1">
                    <Text variant="small" className="text-text-primary">
                      {formatPeriod(instalment.period)}
                    </Text>
                    {instalment.interest > 0 ? (
                      <Text variant="caption" className="text-text-secondary">
                        {formatMoney(instalment.principal, loan.currency)} +{" "}
                        {formatMoney(instalment.interest, loan.currency)}{" "}
                        interest
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    variant="small"
                    tabular
                    className="font-semibold text-text-primary"
                  >
                    {formatMoney(instalment.total, loan.currency)}
                  </Text>
                  {instalment.paid ? (
                    <CheckCircle2
                      size={18}
                      color={colors.success}
                      accessibilityLabel="Paid"
                    />
                  ) : (
                    <View className="w-[18px]" />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}
    </Sheet>
  );
}

function ApplySheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const company = useMyCompany();
  const apply = useApplyForLoan();
  const [loanType, setLoanType] = useState<"loan" | "salary_advance">(
    "salary_advance",
  );
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("1");
  const [firstPeriod, setFirstPeriod] = useState(() => nextPeriod());
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);

  // No fallback: guessing NGN priced a Ghana loan in naira. The form waits
  // for the company (it's cached for the session, so this is brief).
  const currency = company.data?.currency;
  const principal = currency ? parseAmount(amount, currency) : null;
  const months = Number(term);
  const termValid = Number.isInteger(months) && months >= 1 && months <= 120;
  const periods = useMemo(
    () => Array.from({ length: 12 }, (_, i) => addMonths(nextPeriod(), i)),
    [],
  );

  const ready = principal !== null && termValid && purpose.trim().length >= 3;

  const reset = () => {
    setAmount("");
    setTerm("1");
    setPurpose("");
    setError(null);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      dismissable={!apply.isPending}
      title="Apply for a loan"
      subtitle="It goes to HR and finance for approval."
      footer={
        <Button
          label="Submit application"
          size="lg"
          block
          haptic
          disabled={!ready}
          loading={apply.isPending}
          onPress={() => {
            if (principal === null) return;
            setError(null);
            apply.mutate(
              {
                loanType,
                principal,
                termMonths: months,
                firstRepaymentPeriod: firstPeriod,
                purpose: purpose.trim(),
              },
              {
                onSuccess: () => {
                  toast.success(
                    "Application sent",
                    "You'll be told when it's decided.",
                  );
                  reset();
                  onClose();
                },
                onError: (e) => setError(errorMessage(e)),
              },
            );
          }}
        />
      }
    >
      <SegmentedControl
        value={loanType}
        onChange={(next) => {
          setLoanType(next);
          // An advance is usually repaid from the next salary; a loan over a year.
          setTerm(next === "salary_advance" ? "1" : "12");
        }}
        options={[
          { value: "salary_advance", label: "Salary advance" },
          { value: "loan", label: "Staff loan" },
        ]}
      />
      <Field label={currency ? `Amount (${currency})` : "Amount"} required>
        <Input
          accessibilityLabel={currency ? `Amount in ${currency}` : "Amount"}
          value={amount}
          onChangeText={setAmount}
          keyboardType={decimalsFor(currency) ? "decimal-pad" : "number-pad"}
          placeholder={amountPlaceholder(currency)}
          style={{ fontVariant: ["tabular-nums"] }}
        />
      </Field>
      <Field
        label="Repay over (months)"
        required
        error={term && !termValid ? "Between 1 and 120 months." : null}
      >
        <Input
          accessibilityLabel="Repay over how many months"
          value={term}
          onChangeText={setTerm}
          keyboardType="number-pad"
          maxLength={3}
        />
      </Field>
      <Field
        label="First repayment"
        required
        hint="The payroll month the first repayment is taken from."
      >
        <Select
          title="First repayment"
          value={firstPeriod}
          onChange={setFirstPeriod}
          options={periods.map((period) => ({
            value: period,
            label: formatPeriod(period),
          }))}
        />
      </Field>
      {principal !== null && termValid ? (
        <View className="gap-1 rounded-2xl bg-brand-subtle p-4">
          <Text variant="small" className="text-text-body">
            Roughly{" "}
            <Text
              variant="small"
              tabular
              className="font-semibold text-text-primary"
            >
              {formatMoney(Math.ceil(principal / months), currency)}
            </Text>{" "}
            a month before any interest, from {formatPeriod(firstPeriod)}.
          </Text>
          <Text variant="caption" className="text-text-secondary">
            The final schedule is set when it&apos;s approved.
          </Text>
        </View>
      ) : null}
      <Field label="What it's for" required error={error}>
        <Input
          value={purpose}
          onChangeText={setPurpose}
          multiline
          maxLength={500}
          placeholder="e.g. School fees"
        />
      </Field>
    </Sheet>
  );
}
