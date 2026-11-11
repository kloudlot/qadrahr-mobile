import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { FileDown } from "lucide-react-native";

import { PayslipLines } from "@/components/pay/PayslipLines";
import { formatPeriod, useOpenPayslip } from "@/components/pay/payslipActions";
import { EmptyView, ErrorView } from "@/components/state/StateViews";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/queries/company";
import { useMyPayslips } from "@/lib/queries/payslips";

/** One payslip, line by line, with the PDF a tap away. */
export default function PayslipScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payslips = useMyPayslips();
  const download = useOpenPayslip();
  const payslip = payslips.data?.find((row) => row._id === id);

  return (
    <Screen
      header={<ScreenHeader title={payslip ? formatPeriod(payslip) : "Payslip"} subtitle="Payslip" />}
      footer={
        payslip ? (
          <Button
            label="Download PDF"
            icon={FileDown}
            size="lg"
            block
            loading={download.isPending}
            onPress={() => download.open(payslip._id)}
          />
        ) : null
      }
    >
      {payslips.isLoading ? (
        <SkeletonList rows={4} />
      ) : payslips.error ? (
        <ErrorView message={errorMessage(payslips.error)} onRetry={() => void payslips.refetch()} />
      ) : !payslip ? (
        <EmptyView title="Payslip not found" detail="It may have been replaced by a corrected run." />
      ) : (
        <View className="gap-6 pt-2">
          <View className="items-center gap-1 rounded-3xl bg-brand-subtle px-4 py-6">
            <Text variant="micro" className="text-brand">
              Net pay
            </Text>
            <Text variant="display" tabular className="text-text-primary">
              {formatMoney(payslip.netPay, payslip.currency)}
            </Text>
            <Text variant="caption" className="text-text-secondary">
              {formatDate(payslip.periodStart)} – {formatDate(payslip.periodEnd)}
            </Text>
          </View>
          <PayslipLines payslip={payslip} />
        </View>
      )}
    </Screen>
  );
}
