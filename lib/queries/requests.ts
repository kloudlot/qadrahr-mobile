import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Item, Res } from "@/lib/api/types";
import type { ApprovalItem } from "@/lib/queries/approvals";

/**
 * My requests — everything I've raised that goes through approval
 * (leave, corrections, profile changes, expenses, resignation…), read from
 * the workflow engine so one list covers every module.
 */

export type Decision = Item<"GET /approvals/{id}/decisions">;


export const requestKeys = {
  all: ["requests"] as const,
  one: (id: string) => ["requests", id] as const,
  decisions: (id: string) => ["requests", id, "decisions"] as const,
};

export function useMyRequests() {
  return useQuery({
    queryKey: requestKeys.all,
    queryFn: async () =>
      (await http.get<Res<"GET /approvals/mine">>("/approvals/mine", { params: { limit: 50 } })).data.data,
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: requestKeys.one(id),
    queryFn: async () => (await http.get<Res<"GET /approvals/{id}">>(`/approvals/${id}`)).data,
  });
}

export function useRequestDecisions(id: string) {
  return useQuery({
    queryKey: requestKeys.decisions(id),
    queryFn: async () => (await http.get<Res<"GET /approvals/{id}/decisions">>(`/approvals/${id}/decisions`)).data,
  });
}

/**
 * Withdraw or resubmit. Withdrawing through the engine is enough: the
 * owning module reacts to the cancellation (leave releases its reserved
 * days, a correction is marked withdrawn) exactly as when withdrawn from
 * its own screen.
 */
export function useRequestAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "cancel" | "resubmit" }) => {
      await http.post(`/approvals/${id}/${action}`, action === "cancel" ? { reason: "Withdrawn" } : undefined);
    },
    onSuccess: async () => {
      await Promise.all(
        [["requests"], ["leave"], ["corrections"], ["expenses"], ["profile"], ["resignations"]].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}
