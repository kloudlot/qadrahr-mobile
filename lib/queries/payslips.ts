import { useMutation, useQuery } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Item, Res } from "@/lib/api/types";

/**
 * Payslips.
 *
 * Every figure is an INTEGER IN MINOR UNITS, all the way from the
 * server. Nothing here converts to a float except at the moment of
 * display — see `formatMoney`. A rounding error in a payslip is
 * somebody's pay.
 */

export type PayslipLine = Payslip["lines"][number];

/** What a line is, from the API's contract: `informational` is a relief or credit, `employer_cost` is on top of pay. */
export type PayslipLineType = PayslipLine["type"];

export type Payslip = Item<"GET /me/payslips">;

export function useMyPayslips() {
  return useQuery<Payslip[]>({
    queryKey: ["payslips"],
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/payslips">>("/me/payslips");
      // Newest first. The endpoint's order is not documented, and the
      // screen opens on the most recent.
      return [...data].sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));
    },
  });
}

/**
 * Mints a short-lived link to the PDF.
 *
 * A POST, not a GET, because issuing the link is an event the server
 * records — and the storage key never reaches the client. The design is
 * explicit that this is a server-generated document, never a print
 * dialog.
 */
export function usePayslipDownload() {
  return useMutation({
    mutationFn: async (payslipId: string) => {
      const { data } = await http.post<Res<"POST /me/payslips/{id}/download">>(`/me/payslips/${payslipId}/download`);
      return data.url;
    },
  });
}

export type EarlierPayslip = Res<"GET /me/payslips/legacy">;

/**
 * A payslip from before the company moved to this system, read from the
 * old payroll platform on demand. Only offered when the company has set
 * that up (`earlierPayslipsBefore` on `GET /me/company`).
 */
export function useEarlierPayslip(period: string | null) {
  return useQuery({
    queryKey: ["payslips", "earlier", period],
    queryFn: async () =>
      (await http.get<EarlierPayslip>("/me/payslips/legacy", { params: { period } })).data,
    enabled: Boolean(period),
    // A month with no payslip is an answer, not a blip worth retrying.
    retry: false,
    staleTime: Infinity,
  });
}
