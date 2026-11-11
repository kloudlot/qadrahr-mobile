import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Body, Item, Res } from "@/lib/api/types";

/**
 * Staff loans and salary advances. Amounts are integer minor units, as
 * everywhere; the schedule is the server's, generated on application and
 * recomputed on approval.
 */

export type Loan = Item<"GET /me/loans">;

export type Instalment = Loan["instalments"][number];

/** What the employee chooses. Rate and method are left to the server's defaults and the approver. */
export type LoanApplication = Pick<
  Body<"POST /me/loans">,
  "loanType" | "principal" | "termMonths" | "firstRepaymentPeriod" | "purpose"
>;

/**
 * A loan still running against this person's pay. The server refuses a
 * second one while any of these exists — two deductions against one
 * salary is how net pay goes negative — so the app says so up front.
 */
export const OPEN_LOAN_STATUSES: readonly Loan["status"][] = ["pending", "approved", "active"];

const KEY = ["loans"] as const;

export function useMyLoans() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await http.get<Res<"GET /me/loans">>("/me/loans")).data,
  });
}

export function useApplyForLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: LoanApplication) =>
      (await http.post<Res<"POST /me/loans">>("/me/loans", body)).data,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: KEY }),
        queryClient.invalidateQueries({ queryKey: ["requests"] }),
      ]);
    },
  });
}

/** `2026-11` → `Nov 2026`. */
export function formatPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Date(year, month - 1, 1).toLocaleDateString([], { month: "short", year: "numeric" });
}

/** The month after the current one as YYYY-MM: the earliest payroll a new loan can be deducted in. */
export function nextPeriod(from = new Date()): string {
  const next = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

/** YYYY-MM plus n months. */
export function addMonths(period: string, months: number): string {
  const [year, month] = period.split("-").map(Number);
  const next = new Date(year ?? 1970, (month ?? 1) - 1 + months, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}
