import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Item, Res } from "@/lib/api/types";

/**
 * Resigning. Acceptance goes through approval, and does NOT end the
 * employment by itself — HR records the exit on the last working day, and
 * the employee stays on payroll until then.
 */

export type ResignationStatus = "pending" | "accepted" | "rejected" | "cancelled" | "completed";

export type Resignation = Item<"GET /me/resignations">;

const KEY = ["resignations"] as const;

export function useMyResignations() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await http.get<Res<"GET /me/resignations">>("/me/resignations")).data,
  });
}

export function useResign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { lastWorkingDay: string; reason: string }) =>
      (await http.post<Res<"POST /me/resignations">>("/me/resignations", body)).data,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: KEY }),
        queryClient.invalidateQueries({ queryKey: ["requests"] }),
      ]);
    },
  });
}

export function useWithdrawResignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.post(`/me/resignations/${id}/withdraw`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: KEY }),
        queryClient.invalidateQueries({ queryKey: ["requests"] }),
      ]);
    },
  });
}
