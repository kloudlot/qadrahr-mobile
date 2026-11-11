import { useQuery } from "@tanstack/react-query";

import { http } from "@/lib/api";
import { decimalsFor, toMajor } from "@/lib/money";
import type { Res } from "@/lib/api/types";

export type MyCompany = Res<"GET /me/company">;

/**
 * The company the caller is acting in.
 *
 * Effectively static — it changes when HR reconfigures the entity, not
 * between screens — so it is cached for the session and shared by the
 * leave preview (which needs `workDays`) and the payslip (which needs
 * `currency`).
 */
export function useMyCompany() {
  return useQuery<MyCompany>({
    queryKey: ["company", "me"],
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/company">>("/me/company");
      return data;
    },
    staleTime: Infinity,
  });
}

/**
 * Formats integer minor units in their currency.
 *
 * Minor units all the way from the server — a float would round
 * someone's pay. The division happens once, here, at the point of
 * display, by the currency's own decimal places (0 for JPY, 3 for KWD).
 * Without a currency (still loading) the number shows with no symbol
 * rather than a wrong one.
 */
export function formatMoney(
  minorUnits: number,
  currency: string | null | undefined,
): string {
  const digits = decimalsFor(currency);
  const amount = toMajor(minorUnits, currency);
  if (!currency) {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}
