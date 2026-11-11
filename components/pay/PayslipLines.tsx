import { View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { formatMoney } from "@/lib/queries/company";
import type { Payslip, PayslipLine } from "@/lib/queries/payslips";

/**
 * The payslip, line by line: what each item is and how much. How a
 * figure was worked out is HR's (the API leaves it out), and lines that
 * came to nothing are not sent.
 *
 * `amount` is always POSITIVE on the wire and `type` carries the sign,
 * so the minus goes on at render. Rendering a stored negative would
 * double up the moment someone changed how a deduction is stored.
 *
 * Employer contributions are shown, in their own section and explicitly
 * marked as not deducted — the design calls this out for NSITF and ITF.
 * Hiding them invites the question "what is this for" at the worst
 * possible moment; showing them without the label invites "why was this
 * taken off me".
 */
export function PayslipLines({ payslip }: { payslip: Payslip }) {
  // Grouped by the line's type, as the PDF groups them. Reliefs and credits
  // are `informational`: they lower the tax, and nothing is taken for them.
  const ofType = (type: PayslipLine["type"]) => payslip.lines.filter((line) => line.type === type);
  const earnings = ofType("earning");
  const deductions = ofType("deduction");
  const information = ofType("informational");
  const employer = ofType("employer_cost");

  return (
    <View className="gap-4">
      <Card className="gap-3">
        <Section title="Earnings" lines={earnings} currency={payslip.currency} />

        <Total label="Gross" amount={payslip.gross} currency={payslip.currency} />

        {deductions.length > 0 ? (
          <>
            <Divider />
            <Section
              title="Deductions"
              lines={deductions}
              currency={payslip.currency}
              negative
            />
          </>
        ) : null}

        <Divider />
        <Total
          label="Net pay"
          amount={payslip.netPay}
          currency={payslip.currency}
          emphasis
        />
      </Card>

      {information.length > 0 ? (
        <Card className="gap-2">
          <Section
            title="Reliefs and credits"
            lines={information}
            currency={payslip.currency}
            muted
          />
          <Text variant="caption" className="text-text-secondary">
            These lower the tax you owe. They are not taken from your pay.
          </Text>
        </Card>
      ) : null}

      {employer.length > 0 ? (
        <Card className="gap-2">
          <Section
            title="Paid by your employer"
            lines={employer}
            currency={payslip.currency}
            muted
          />
          <Text variant="caption" className="text-text-secondary">
            These are employer contributions. They are not deducted from your pay.
          </Text>
        </Card>
      ) : null}
    </View>
  );
}

function Section({
  title,
  lines,
  currency,
  negative = false,
  muted = false,
}: {
  title: string;
  lines: PayslipLine[];
  currency: string;
  negative?: boolean;
  muted?: boolean;
}) {
  if (lines.length === 0) return null;

  return (
    <View className="gap-2">
      <Text variant="micro" className="text-text-secondary">
        {title}
      </Text>

      {lines.map((line) => (
        <View key={`${line.componentCode}-${line.name}`}>
          <View className="flex-row items-baseline justify-between gap-3">
            <Text
              variant="body"
              className={`flex-1 ${muted ? "text-text-secondary" : "text-text-primary"}`}
            >
              {line.name}
            </Text>
            <Text
              variant="body"
              tabular
              className={
                negative
                  ? "text-danger-ink"
                  : muted
                    ? "text-text-secondary"
                    : "text-text-primary"
              }
            >
              {negative ? "−" : ""}
              {formatMoney(line.amount, currency)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Total({
  label,
  amount,
  currency,
  emphasis = false,
}: {
  label: string;
  amount: number;
  currency: string;
  emphasis?: boolean;
}) {
  return (
    <View className="flex-row items-baseline justify-between gap-3">
      <Text
        variant={emphasis ? "body" : "small"}
        className={emphasis ? "font-semibold text-text-primary" : "text-text-secondary"}
      >
        {label}
      </Text>
      <Text
        variant={emphasis ? "h3" : "body"}
        tabular
        className={emphasis ? "font-semibold text-text-primary" : "text-text-primary"}
      >
        {formatMoney(amount, currency)}
      </Text>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-border" />;
}
