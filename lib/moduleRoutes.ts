import type { Module } from "@/lib/queries/modules";

/**
 * Which module each screen belongs to, by path prefix (route groups are
 * not part of a path). A screen not listed — home, profile, requests,
 * approvals — every employer has.
 */
const MODULE_ROUTES: [prefix: string, module: Module][] = [
  ["/attendance", "time_attendance"],
  ["/face", "face_attendance"],
  ["/leave", "leave"],
  ["/pay", "payroll"],
  ["/loans", "payroll"],
  ["/expenses", "expenses"],
  ["/performance", "performance"],
  ["/learning", "learning"],
  ["/documents", "documents"],
  ["/assets", "assets"],
  ["/announcements", "broadcast"],
  ["/cases", "employee_relations"],
  ["/speak-up", "employee_relations"],
  ["/policies", "employee_relations"],
];

/** The module a path belongs to, or null when every employer has it. */
export function moduleForPath(pathname: string): Module | null {
  const match = MODULE_ROUTES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match ? match[1] : null;
}
