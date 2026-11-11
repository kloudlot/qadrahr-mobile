import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Item, Res } from "@/lib/api/types";

export type Announcement = Item<"GET /me/broadcasts">;

export const broadcastKeys = {
  all: ["broadcasts"] as const,
  feed: ["broadcasts", "feed"] as const,
  unread: ["broadcasts", "unread"] as const,
};

/**
 * Announcements sent to me: pinned first, then newest.
 *
 * `retry: false` because an organisation without the broadcast module
 * answers 403 — that means "no announcements here", not a fault worth
 * retrying.
 */
export function useAnnouncements() {
  return useQuery({
    queryKey: broadcastKeys.feed,
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/broadcasts">>("/me/broadcasts", { params: { limit: 50 } });
      return data.data;
    },
    retry: false,
  });
}

export function useAnnouncementCounts() {
  return useQuery({
    queryKey: broadcastKeys.unread,
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/broadcasts/unread-count">>("/me/broadcasts/unread-count");
      return data;
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.post(`/me/broadcasts/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: broadcastKeys.all }),
  });
}

export function useAcknowledgeAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.post(`/me/broadcasts/${id}/acknowledge`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: broadcastKeys.all }),
  });
}
