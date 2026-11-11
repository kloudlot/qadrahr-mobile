import { Linking } from "react-native";

import { toast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/api";
import { usePayslipDownload, type Payslip } from "@/lib/queries/payslips";

/**
 * Opens a payslip's PDF. The server mints a short-lived link and the OS
 * opens it — nothing is rendered or printed on the device; the PDF is the
 * authoritative document.
 */
export function useOpenPayslip() {
  const download = usePayslipDownload();
  return {
    isPending: download.isPending,
    open: (id: string) =>
      download.mutate(id, {
        onSuccess: (url) => void Linking.openURL(url),
        onError: (error) => toast.error("Couldn't open the PDF", errorMessage(error)),
      }),
  };
}

/** `August 2026`, from the period end — which is the month people mean. */
export function formatPeriod(payslip: Payslip): string {
  const end = new Date(`${payslip.periodEnd}T00:00:00Z`);
  if (Number.isNaN(end.getTime())) return payslip.periodEnd;
  return end.toLocaleDateString([], { month: "long", year: "numeric", timeZone: "UTC" });
}
