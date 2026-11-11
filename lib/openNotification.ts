import { router, type Href } from "expo-router";
import type { QueryClient } from "@tanstack/react-query";

import { http } from "@/lib/api";
import { notificationTarget } from "@/lib/notificationTarget";

/** What a push carries: `{ type, notificationId, path, ...data }`. */
export type PushPayload = Record<string, unknown> | undefined;

/**
 * Where a push opens, and which row it marks read.
 *
 * The same place its row in the notifications list opens. Something the
 * app has no screen for (an HR-only page on the web) opens the list, so a
 * tap never does nothing.
 */
export function pushDestination(payload: PushPayload): { href: Href; notificationId: string | null } {
  const { type, ...data } = payload ?? {};
  return {
    href: notificationTarget({ type, data }) ?? "/notifications",
    notificationId: typeof data.notificationId === "string" ? data.notificationId : null,
  };
}

/**
 * Opens a push and marks it read — whether it was tapped in the system tray
 * or as the in-app toast shown while the app was open. One path, so the two
 * cannot drift.
 */
export function openNotification(payload: PushPayload, queryClient: QueryClient): void {
  const { href, notificationId } = pushDestination(payload);
  if (notificationId) {
    void http
      .patch(`/me/notifications/${notificationId}/read`)
      .then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }))
      .catch(() => undefined);
  }
  router.push(href);
}
