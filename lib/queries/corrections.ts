import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Body, Item, Res } from "@/lib/api/types";
import { attendanceKeys } from "@/lib/queries/attendance";

/**
 * Attendance corrections — asking for a missed punch to be added, or a
 * recorded time fixed.
 *
 * Nothing changes in the employee's attendance when they ask: the request
 * goes to their manager, and only an approved one is applied, as a new
 * punch that supersedes the old (the raw record is evidence, and is never
 * edited).
 */

export type CorrectionKind = "missing" | "correct";
export type CorrectionStatus = "pending" | "applied" | "rejected" | "cancelled" | "failed";

export type CorrectionRequest = Item<"GET /me/attendance/corrections">;

export type NewCorrection = Body<"POST /me/attendance/corrections">;

export const correctionKeys = {
  all: ["corrections"] as const,
};

export function useMyCorrections() {
  return useQuery({
    queryKey: correctionKeys.all,
    queryFn: async () => (await http.get<Res<"GET /me/attendance/corrections">>("/me/attendance/corrections")).data,
  });
}

export function useRequestCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: NewCorrection) =>
      (await http.post<Res<"POST /me/attendance/corrections">>("/me/attendance/corrections", body)).data,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: correctionKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["requests"] }),
      ]);
    },
  });
}

export function useWithdrawCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.post(`/me/attendance/corrections/${id}/cancel`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: correctionKeys.all }),
        queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["requests"] }),
      ]);
    },
  });
}
