import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Body, Item, Res } from "@/lib/api/types";

/**
 * My employee record, and the self-service change requests against it.
 *
 * A change is never written straight to the record: it is held as a
 * request until approved (a bank change without review is the classic
 * payroll-fraud path), so the screen shows the pending values beside the
 * current ones.
 */

export type NextOfKin = NonNullable<MyProfile["nextOfKin"]>;

export type BankDetails = NonNullable<MyProfile["bank"]>;

export type MyProfile = Res<"GET /me/profile">;

export type ProfileChanges = Body<"PATCH /me/profile">;

export type ProfileChangeRequest = Item<"GET /me/profile-changes">;

export type Bank = Res<"GET /supported-banks">["banks"][number];

export const profileKeys = {
  me: ["profile", "me"] as const,
  changes: ["profile", "changes"] as const,
  banks: ["profile", "banks"] as const,
};

export function useMyProfile() {
  return useQuery<MyProfile>({
    queryKey: profileKeys.me,
    queryFn: async () => (await http.get<Res<"GET /me/profile">>("/me/profile")).data,
    // Changes when HR moves someone, not between screens.
    staleTime: 15 * 60 * 1000,
  });
}

export function useProfileChanges() {
  return useQuery({
    queryKey: profileKeys.changes,
    queryFn: async () => (await http.get<Res<"GET /me/profile-changes">>("/me/profile-changes")).data,
  });
}

/**
 * The banks the organisation pays into, for a bank change — the only ones a
 * change is accepted for. The baseline Employee role can read them; callers
 * still treat a failure as "bank changes go through HR".
 */
export function useBanks() {
  return useQuery({
    queryKey: profileKeys.banks,
    queryFn: async () =>
      (await http.get<Res<"GET /supported-banks">>("/supported-banks", { params: { active: true } })).data.banks,
    staleTime: Infinity,
    retry: false,
  });
}

export function useRequestProfileChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ProfileChanges & { reason?: string }) =>
      (await http.patch<Res<"PATCH /me/profile">>("/me/profile", body)).data,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.changes }),
        queryClient.invalidateQueries({ queryKey: ["requests"] }),
      ]);
    },
  });
}

export function useWithdrawProfileChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.post(`/me/profile-changes/${id}/cancel`);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.changes }),
        queryClient.invalidateQueries({ queryKey: ["requests"] }),
      ]);
    },
  });
}
