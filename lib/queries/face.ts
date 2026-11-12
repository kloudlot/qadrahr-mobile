import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Res } from "@/lib/api/types";
import type { FacePurpose, FaceStatus } from "@/lib/face";

/**
 * The face check at clock-in: where the signed-in employee stands, their
 * agreement, and starting a sitting.
 */

export const faceKeys = {
  status: ["face", "status"] as const,
};

/**
 * Whether a face is asked for at clock-in, and what is still to do.
 *
 * Kept fresh for a few minutes rather than refetched on every focus: it
 * changes when the employee enrols (which invalidates it here) or when HR
 * approves, not from moment to moment. A failure reads as "nothing asked"
 * — the server still decides what a punch is worth, so the worst a stale
 * or missing status does is skip a sitting the server will then flag.
 */
export function useFaceStatus() {
  return useQuery({
    queryKey: faceKeys.status,
    queryFn: async () => (await http.get<FaceStatus>("/me/attendance/face/status")).data,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useGiveFaceConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (noticeVersion: number) =>
      (await http.post<FaceStatus>("/me/attendance/face/consent", { noticeVersion })).data,
    onSuccess: (status) => queryClient.setQueryData(faceKeys.status, status),
  });
}

export function useWithdrawFaceConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await http.delete("/me/attendance/face/consent");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: faceKeys.status }),
  });
}

export type FaceSessionStarted = Res<"POST /me/attendance/face/sessions">;

/** Starts a sitting and returns the capture page to open. */
export async function startFaceSession(purpose: FacePurpose): Promise<FaceSessionStarted> {
  return (await http.post<FaceSessionStarted>("/me/attendance/face/sessions", { purpose })).data;
}
