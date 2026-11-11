import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Body, Item, Res } from "@/lib/api/types";

/**
 * Employee relations from the employee's side: policies to accept, cases
 * raised about them, and speaking up. All behind the employer's
 * `employee_relations` module.
 */

export type Policy = Item<"GET /me/policies/outstanding">;

export type Case = Item<"GET /me/er-cases">;

export type CaseStage = Case["stage"];

export type ReportCategory = Body<"POST /me/whistleblowing">["category"];

export type Report = Res<"POST /me/whistleblowing/follow-up">;

export const workplaceKeys = {
  policies: ["policies", "outstanding"] as const,
  cases: ["er-cases"] as const,
};

/** Policies this person still has to accept. A new version shows up again for everyone. */
export function useOutstandingPolicies(enabled = true) {
  return useQuery({
    queryKey: workplaceKeys.policies,
    queryFn: async () => (await http.get<Res<"GET /me/policies/outstanding">>("/me/policies/outstanding")).data,
    enabled,
    // A tenant without the module answers 403; that is "nothing to accept", not an error to retry.
    retry: false,
  });
}

export function useAcknowledgePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.post(`/me/policies/${id}/acknowledge`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workplaceKeys.policies });
    },
  });
}

export function useMyCases() {
  return useQuery({
    queryKey: workplaceKeys.cases,
    queryFn: async () => (await http.get<Res<"GET /me/er-cases">>("/me/er-cases")).data,
  });
}

/** Answering a case (while it is awaiting a response) or appealing its decision (once decided). */
export function useCaseAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; mode: "respond" | "appeal"; text: string }) => {
      const body: Body<"POST /me/er-cases/{id}/respond"> | Body<"POST /me/er-cases/{id}/appeal"> =
        input.mode === "respond" ? { response: input.text } : { grounds: input.text };
      return (await http.post<Case>(`/me/er-cases/${input.id}/${input.mode}`, body)).data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workplaceKeys.cases });
    },
  });
}

/**
 * Reporting. Deliberately nothing is cached: the reference and access
 * code are shown once, and a report thread is only ever held in the
 * screen's state, so it is gone the moment the screen is.
 */
export function useSubmitReport() {
  return useMutation({
    mutationFn: async (body: Body<"POST /me/whistleblowing">) =>
      (await http.post<Res<"POST /me/whistleblowing">>("/me/whistleblowing", body)).data,
  });
}

export function useOpenReport() {
  return useMutation({
    mutationFn: async (body: Body<"POST /me/whistleblowing/follow-up">) =>
      (await http.post<Report>("/me/whistleblowing/follow-up", body)).data,
  });
}

export function useReplyToReport() {
  return useMutation({
    mutationFn: async (body: Body<"POST /me/whistleblowing/follow-up/reply">) =>
      (await http.post<Report>("/me/whistleblowing/follow-up/reply", body)).data,
  });
}
