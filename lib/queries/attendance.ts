import { useQuery } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Item, Res } from "@/lib/api/types";

/**
 * Everything the clock screen reads.
 *
 * Types come from the API's contract (lib/api, generated from its
 * committed openapi.json by `npm run gen:api`), so a field the API renames
 * or drops fails to compile here rather than reading as undefined on a
 * phone.
 */

export type AttendanceDay = Item<"GET /me/attendance">;

/** The server's day statuses — a union, so a status it never sends cannot be checked for. */
export type AttendanceStatus = AttendanceDay["status"];

/** All overtime, whichever bucket it is paid from. */
export function overtimeMinutes(day: AttendanceDay): number {
  return day.overtimeWeekdayMinutes + day.overtimeRestDayMinutes + day.overtimeHolidayMinutes;
}

export type PunchEvent = Item<"GET /me/attendance/punches/{businessDate}">;

export type MyShift = Res<"GET /me/attendance/shift/{businessDate}">;

export type WorkLocation = Res<"GET /me/attendance/work-location">;

/** The local calendar date, which is what `businessDate` is keyed on. */
export function today(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Monday of the week containing `date`, as YYYY-MM-DD. */
export function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  // getUTCDay: 0 = Sunday, so Sunday belongs to the week that started six
  // days earlier rather than the one about to start.
  const offset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const attendanceKeys = {
  all: ["attendance"] as const,
  day: (businessDate: string) => ["attendance", "day", businessDate] as const,
  punches: (businessDate: string) => ["attendance", "punches", businessDate] as const,
  week: (monday: string) => ["attendance", "week", monday] as const,
  range: (from: string, to: string) => ["attendance", "range", from, to] as const,
  workLocation: ["attendance", "work-location"] as const,
  shift: (businessDate: string) => ["attendance", "shift", businessDate] as const,
  /** Punches on this device the server has not received. Local, not an API read. */
  queue: (userId: string) => ["attendance", "queue", userId] as const,
};

/** Today's aggregated day. The source of truth for worked minutes. */
export function useToday(businessDate: string) {
  return useQuery({
    queryKey: attendanceKeys.day(businessDate),
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/attendance">>("/me/attendance", {
        params: { from: businessDate, to: businessDate, limit: 1 },
      });
      // No row yet is the normal state before the first punch of the day,
      // not an error.
      return data.data[0] ?? null;
    },
  });
}

/**
 * Today's raw punches.
 *
 * Needed alongside the day because `firstIn` is the day's FIRST in — after
 * a lunch break it points at the morning, not at the session open now. A
 * running timer built on it counts from the wrong anchor.
 */
export function usePunches(businessDate: string) {
  return useQuery({
    queryKey: attendanceKeys.punches(businessDate),
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/attendance/punches/{businessDate}">>(
        `/me/attendance/punches/${businessDate}`,
      );
      return data;
    },
  });
}

/**
 * My branch and its fence.
 *
 * `staleTime: Infinity` — a branch fence changes when HR moves an office,
 * not between clock-ins. Refetching it on every screen focus would be a
 * round trip per glance for data that is effectively static.
 */
export function useWorkLocation() {
  return useQuery({
    queryKey: attendanceKeys.workLocation,
    queryFn: async () => {
      const { data } = await http.get<WorkLocation>("/me/attendance/work-location");
      return data;
    },
    staleTime: Infinity,
  });
}

/**
 * The shift I am rostered on for a date.
 *
 * `scheduledMinutes` is computed server-side — a night shift spans
 * midnight, and 22:00 to 06:00 is eight hours rather than minus
 * sixteen. The client does not parse the times.
 *
 * A roster changes when HR changes it, not between clock-ins, so this
 * is cached for the day it describes.
 */
export function useMyShift(businessDate: string) {
  return useQuery<MyShift>({
    queryKey: attendanceKeys.shift(businessDate),
    queryFn: async () => {
      const { data } = await http.get<MyShift>(`/me/attendance/shift/${businessDate}`);
      return data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

/** Monday to Sunday, for the week strip. */
export function useWeek(monday: string) {
  return useQuery({
    queryKey: attendanceKeys.week(monday),
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/attendance">>("/me/attendance", {
        params: { from: monday, to: addDays(monday, 6), limit: 7 },
      });
      return data.data;
    },
  });
}

/** Every recorded day in a range, newest first — the Attendance tab's list. */
export function useAttendanceRange(from: string, to: string) {
  return useQuery({
    queryKey: attendanceKeys.range(from, to),
    queryFn: async () => {
      const { data } = await http.get<Res<"GET /me/attendance">>("/me/attendance", {
        // 100 is the API's page cap; a month is at most 31 days.
        params: { from, to, limit: 100 },
      });
      return data.data;
    },
  });
}
