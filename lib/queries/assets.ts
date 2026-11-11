import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Item, Res } from "@/lib/api/types";

export const ASSET_CATEGORIES = [
  "laptop",
  "desktop",
  "monitor",
  "phone",
  "tablet",
  "vehicle",
  "furniture",
  "accessory",
  "other",
] as const;

export type HeldAsset = Res<"GET /me/assets">["holding"][number];

export type AssetRequest = Item<"GET /me/asset-requests">;

export const assetKeys = {
  all: ["assets"] as const,
  mine: ["assets", "mine"] as const,
  requests: ["assets", "requests"] as const,
};

/** What I hold. `retry: false`: 403 means the organisation doesn't use assets. */
export function useMyAssets() {
  return useQuery({
    queryKey: assetKeys.mine,
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/assets">>("/me/assets");
      return data.holding;
    },
    retry: false,
  });
}

export function useMyAssetRequests() {
  return useQuery({
    queryKey: assetKeys.requests,
    queryFn: async () => (await http.get<Res<"GET /me/asset-requests">>("/me/asset-requests")).data,
    retry: false,
  });
}

export function useReportAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; kind: "fault" | "damage" | "loss"; description: string }) => {
      await http.post(`/me/assets/${input.id}/report`, { kind: input.kind, description: input.description });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

export function useRequestAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { category: string; reason: string; neededBy?: string }) => {
      await http.post("/me/asset-requests", input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

export function useCancelAssetRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.post(`/me/asset-requests/${id}/cancel`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assetKeys.all }),
  });
}
