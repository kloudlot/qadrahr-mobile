import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { entitledDays } from "@/lib/leaveBalance";
import { http } from "@/lib/api";
import type { Body, Item, Res } from "@/lib/api/types";

/**
 * Leave: balances, history, and making a request.
 *
 * Balances and types are fetched together and joined here, because the
 * balance rows carry a `leaveTypeId` and nothing an employee can read. A
 * screen that showed "8 days remaining" without saying of what would be
 * worse than showing nothing.
 */

type LeaveBalance = Item<"GET /me/leave/balances">;

export type LeaveType = Item<"GET /me/leave/types">;

export type LeaveRequest = Item<"GET /me/leave/requests">;

/** One type's entitlement, ready to render as a bar. */
export interface LeaveEntitlement {
  leaveTypeId: string;
  name: string;
  /** accrued + carriedOver. Zero means "on request" rather than a quota. */
  entitled: number;
  taken: number;
  pending: number;
  available: number;
  allowHalfDays: boolean;
}


export const leaveKeys = {
  all: ["leave"] as const,
  entitlements: (year: number) => ["leave", "entitlements", year] as const,
  requests: ["leave", "requests"] as const,
  types: ["leave", "types"] as const,
};

/**
 * The types I can request: active ones, minus those for another gender.
 * Self-service, so it needs no permission — `/leave/types` is the admin
 * list, behind `leave:read`.
 */
async function fetchTypes(): Promise<LeaveType[]> {
  const { data } = await http.get<Res<"GET /me/leave/types">>("/me/leave/types");
  return data;
}

/** Leave types on their own, for the request form's picker. */
export function useLeaveTypes() {
  return useQuery({
    queryKey: leaveKeys.types,
    queryFn: fetchTypes,
    // Configuration, not activity. It changes when HR adds a leave type.
    staleTime: 60 * 60 * 1000,
  });
}

export function useEntitlements(year: number) {
  return useQuery<LeaveEntitlement[]>({
    queryKey: leaveKeys.entitlements(year),
    queryFn: async () => {
      const [balances, types] = await Promise.all([
        http.get<Res<"GET /me/leave/balances">>("/me/leave/balances", { params: { year } }),
        fetchTypes(),
      ]);

      const byId = new Map(types.map((type) => [type._id, type]));

      return balances.data
        .map((balance) => {
          const type = byId.get(balance.leaveTypeId);
          if (!type) return null;

          return {
            leaveTypeId: balance.leaveTypeId,
            name: type.name,
            entitled: entitledDays(balance),
            taken: balance.taken,
            pending: balance.pending,
            available: balance.available,
            allowHalfDays: type.allowHalfDays,
          };
        })
        .filter((row): row is LeaveEntitlement => row !== null);
    },
  });
}

export function useMyLeaveRequests() {
  return useQuery({
    queryKey: leaveKeys.requests,
    queryFn: async () => {
      // A plain array, newest first. (Typed by hand as paginated, this
      // read `.data` off an array — undefined — so the history stayed empty.)
      const { data } = await http.get<Res<"GET /me/leave/requests">>("/me/leave/requests");
      return data;
    },
  });
}

export type NewLeaveRequest = Body<"POST /me/leave/requests">;

export function useRequestLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: NewLeaveRequest) => {
      const { data } = await http.post<Res<"POST /me/leave/requests">>("/me/leave/requests", request);
      return data;
    },
    onSuccess: async () => {
      // Both the list and the balances move: a pending request reserves
      // days, so `available` drops the moment it is filed.
      await queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}

export function useWithdrawLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      await http.post(`/me/leave/requests/${requestId}/withdraw`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}
