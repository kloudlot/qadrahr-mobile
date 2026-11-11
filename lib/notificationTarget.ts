import type { Href } from "expo-router";

/**
 * Where a notification goes when tapped, for the notifications list and a
 * tapped push alike. A push carries `{ type, ...data }`; a listed
 * notification has the same two fields.
 *
 * The server's `data.path` names the web screen (workflow notifications
 * carry one). It maps to this app's screen where there is one. Otherwise
 * the type decides.
 *
 * Deliberately conservative: only places that can actually show the
 * thing. Null leaves the row as a read receipt, which beats a best guess
 * that lands on an unrelated list.
 */
export function notificationTarget(notification: {
  type?: unknown;
  data?: Record<string, unknown> | null;
}): Href | null {
  const type = typeof notification.type === "string" ? notification.type : "";
  const data = notification.data ?? {};

  if (typeof data.path === "string") {
    // Matched without its query string: an announcement's path is
    // `/me/announcements?broadcast=<id>`.
    // (Parsed by hand: React Native's URLSearchParams lacks `get`.)
    const [pathname = "", query = ""] = data.path.split("?");
    if (pathname === "/me/announcements") {
      const id = /(?:^|&)broadcast=([^&]+)/.exec(query)?.[1] ?? data.broadcastId;
      return typeof id === "string" && id
        ? `/announcements/${decodeURIComponent(id)}`
        : "/announcements";
    }
    // The payslip itself, not the list, when the push names one.
    if (pathname === "/me/payslips" && typeof data.payslipId === "string") {
      return `/pay/${data.payslipId}`;
    }
    const mapped = WEB_PATHS[pathname];
    if (mapped) return mapped;
  }

  // Waiting on me: a new step, reminders, escalations, and an override of
  // something that was in my inbox.
  if (
    type.startsWith("approval.") ||
    [
      "workflow.pending",
      "workflow.reminder",
      "workflow.escalated",
      "workflow.overridden",
    ].includes(type)
  ) {
    return "/approvals";
  }
  // A decision on something I asked for. With no path, the list of my requests.
  if (type === "workflow.decided") return "/requests";
  if (type.startsWith("leave.")) return "/leave";
  if (type.startsWith("payslip.")) {
    return typeof data.payslipId === "string"
      ? `/pay/${data.payslipId}`
      : "/pay";
  }
  if (type.startsWith("attendance.")) return "/attendance";
  if (type.startsWith("resignation.")) return "/resignation";
  if (type.startsWith("broadcast.")) {
    return typeof data.broadcastId === "string"
      ? `/announcements/${data.broadcastId}`
      : "/announcements";
  }
  if (type.startsWith("performance.")) return "/performance";
  if (type.startsWith("asset.") || typeof data.assetId === "string")
    return "/assets";
  return null;
}

/** The server's web paths, and this app's screen for each. */
const WEB_PATHS: Record<string, Href> = {
  "/workflow/approvals": "/approvals",
  "/me/leave": "/leave",
  "/me/expenses": "/expenses",
  "/me/profile": "/profile",
  "/me/attendance": "/attendance",
  "/me/assets": "/assets",
  "/me/resignation": "/resignation",
  "/me/payslips": "/pay",
  "/me/performance": "/performance",
  "/me/team/performance": "/performance/team",
  "/me/loans": "/loans",
  "/me/cases": "/cases",
  "/me/policies": "/policies",
  "/me/learning": "/learning",
};
