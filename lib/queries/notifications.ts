import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Body, Item, Res } from "@/lib/api/types";

export type AppNotification = Item<"GET /me/notifications">;

/** The list as cached: a page of notifications. */
type NotificationPage = Res<"GET /me/notifications">;


export const notificationKeys = {
  all: ["notifications"] as const,
  list: ["notifications", "list"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
  preferences: ["notifications", "preferences"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/notifications">>("/me/notifications", {
        params: { limit: 50 },
      });
      return data;
    },
  });
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: notificationKeys.unreadCount,
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/notifications/unread-count">>("/me/notifications/unread-count");
      return data.unread;
    },
    // Cheap, and it drives a badge that is wrong the moment it is stale.
    staleTime: 30_000,
    // Every return to the app, fresh or not: an announcement sent while it
    // was in the background must show on the bell straight away.
    refetchOnWindowFocus: "always",
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await http.patch(`/me/notifications/${id}/read`);
    },
    // Optimistic: tapping a notification navigates away immediately, and
    // waiting for a round trip to un-bold it means the change is never
    // seen. Rolled back if the server disagrees.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list });
      const previous = queryClient.getQueryData<NotificationPage>(
        notificationKeys.list,
      );

      queryClient.setQueryData<NotificationPage>(notificationKeys.list, (current) =>
        current
          ? {
              ...current,
              data: current.data.map((row) =>
                row._id === id ? { ...row, readAt: new Date().toISOString() } : row,
              ),
            }
          : current,
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.list, context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await http.patch("/me/notifications/read-all");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * The app-icon badge follows the unread count. A push sets it as it
 * arrives (the server sends the count); this keeps it right as things are
 * read here, or on the web.
 */
export function useAppBadge(): void {
  const unread = useUnreadCount();
  useEffect(() => {
    if (unread.data === undefined) return;
    void Notifications.setBadgeCountAsync(unread.data).catch(() => false);
  }, [unread.data]);
}

export type NotificationPreferences = Res<"GET /me/notifications/preferences">;
type PreferencesUpdate = Body<"PUT /me/notifications/preferences">;

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: async () => {
      const { data } = await http.get<NotificationPreferences>("/me/notifications/preferences");
      return data;
    },
  });
}

/**
 * Optimistic, like marking read: a switch that waits for the network
 * before moving feels broken. Rolled back if the server refuses.
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: PreferencesUpdate) => {
      const { data } = await http.put<NotificationPreferences>(
        "/me/notifications/preferences",
        update,
      );
      return data;
    },
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.preferences });
      const previous = queryClient.getQueryData<NotificationPreferences>(
        notificationKeys.preferences,
      );
      queryClient.setQueryData<NotificationPreferences>(notificationKeys.preferences, (current) =>
        current ? applyPreferences(current, update) : current,
      );
      return { previous };
    },
    onError: (_error, _update, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.preferences, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(notificationKeys.preferences, data);
    },
  });
}

/** What the server will answer to an update, so the switches move at once. */
export function applyPreferences(
  current: NotificationPreferences,
  update: PreferencesUpdate,
): NotificationPreferences {
  const muted = update.push.muted;
  return {
    push: {
      enabled: update.push.enabled ?? current.push.enabled,
      categories: current.push.categories.map((category) => ({
        ...category,
        enabled: muted ? !muted.includes(category.key) : category.enabled,
      })),
    },
  };
}

/** The `muted` list after switching one category on or off. */
export function mutedAfter(
  current: NotificationPreferences,
  key: NotificationPreferences["push"]["categories"][number]["key"],
  enabled: boolean,
): NonNullable<PreferencesUpdate["push"]["muted"]> {
  return current.push.categories
    .filter((category) => (category.key === key ? !enabled : !category.enabled))
    .map((category) => category.key);
}
