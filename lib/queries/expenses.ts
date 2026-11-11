import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toMinor } from "@/lib/money";
import { http } from "@/lib/api";
import type { Body, Item, Res } from "@/lib/api/types";

/**
 * Expense claims.
 *
 * A claim is assembled over days — someone on a trip photographs
 * receipts as they go — so it is opened empty, lines are added one at a
 * time, and it is submitted separately. The API is shaped that way
 * deliberately and this mirrors it rather than batching.
 *
 * Amounts are integer minor units throughout, as everywhere else.
 */

export type ExpenseLine = ExpenseClaim["lines"][number];

export type ExpenseClaim = Item<"GET /me/expenses">;

export const expenseKeys = {
  all: ["expenses"] as const,
  list: ["expenses", "list"] as const,
  one: (id: string) => ["expenses", id] as const,
};

export type ExpenseCategory = Item<"GET /me/expenses/categories">;

/**
 * What a claimant may claim against.
 *
 * Configuration, so cached for the session. An empty list is a company
 * with no expense policy (or one with no categories): the server refuses
 * lines until HR or finance sets one up, so the form says so instead.
 */
export function useExpenseCategories() {
  return useQuery<ExpenseCategory[]>({
    queryKey: ["expenses", "categories"],
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/expenses/categories">>(
        "/me/expenses/categories",
      );
      return data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useMyClaims(status?: string) {
  return useQuery({
    queryKey: [...expenseKeys.list, status ?? "all"],
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/expenses">>("/me/expenses", {
        params: { limit: 50, status },
      });
      return data;
    },
  });
}

export function useOpenClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const { data } = await http.post<Res<"POST /me/expenses">>(
        "/me/expenses",
        { title },
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

/** A line to add, and the claim it joins — which goes in the URL, not the body. */
export type NewExpenseLine = Body<"POST /me/expenses/{id}/lines"> & {
  claimId: string;
};

export function useAddLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ claimId, ...line }: NewExpenseLine) => {
      const { data } = await http.post<Res<"POST /me/expenses/{id}/lines">>(
        `/me/expenses/${claimId}/lines`,
        line,
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useSubmitClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (claimId: string) => {
      const { data } = await http.post<Res<"POST /me/expenses/{id}/submit">>(
        `/me/expenses/${claimId}/submit`,
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

/** Removing a line from a claim still being put together (draft, or queried back). */
export function useRemoveLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      claimId,
      lineId,
    }: {
      claimId: string;
      lineId: string;
    }) => {
      const { data } = await http.delete<
        Res<"DELETE /me/expenses/{id}/lines/{lineId}">
      >(`/me/expenses/${claimId}/lines/${lineId}`);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

/**
 * Parses what someone typed into integer minor units.
 *
 * Returns null rather than 0 for anything unparseable, so an empty or
 * malformed amount cannot silently become a free expense. Accepts a
 * comma as a decimal separator because a phone keypad in much of the
 * world offers one.
 */
export function parseAmount(
  input: string,
  currency: string | null | undefined,
): number | null {
  const cleaned = input.replace(/[^\d.,]/g, "").replace(",", ".");
  if (!cleaned) return null;

  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;

  // Rounded at the minor unit, where the currency's precision ends — a
  // whole yen, a thousandth of a dinar, a kobo.
  return toMinor(value, currency);
}
