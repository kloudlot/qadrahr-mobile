import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Res } from "@/lib/api/types";

/**
 * Two-factor authentication on the account. Setting it up is two steps on
 * purpose: the secret is issued first, and two-factor turns on only once
 * a code from the authenticator proves it was saved.
 */

export type MfaStatus = Res<"GET /me/mfa">;

export type MfaSetup = Res<"POST /me/mfa/setup">;

const KEY = ["mfa"] as const;

export function useMfaStatus() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await http.get<MfaStatus>("/me/mfa")).data,
  });
}

export function useStartMfaSetup() {
  return useMutation({
    mutationFn: async () => (await http.post<MfaSetup>("/me/mfa/setup")).data,
  });
}

/** Returns the recovery codes, which the server shows exactly once. */
export function useEnableMfa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) =>
      (await http.post<Res<"POST /me/mfa/enable">>("/me/mfa/enable", { code })).data.recoveryCodes,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDisableMfa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => (await http.post<MfaStatus>("/me/mfa/disable", { code })).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEY });
    },
  });
}
