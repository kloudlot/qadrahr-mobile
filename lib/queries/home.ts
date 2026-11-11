import { useQuery } from "@tanstack/react-query";

import { http } from "@/lib/api";
import type { Item, Res } from "@/lib/api/types";

/**
 * The two tiles beside the clock: leave left, and the next holiday.
 *
 * Both are glanceable context rather than the reason the screen exists,
 * so both fail quietly — a tile that cannot load renders nothing rather
 * than an error, because an employee who cannot see their leave balance
 * can still clock in, and a red box on the clock screen would suggest
 * otherwise.
 */

type LeaveBalance = Item<"GET /me/leave/balances">;


export interface LeaveLeft {
  days: number;
  typeName: string;
}

/**
 * The balance worth showing on a one-line tile.
 *
 * The largest, named by its own type rather than assumed to be annual
 * leave. Two things would go wrong with a guess: `code` is only unique
 * within a company, so nothing guarantees an "ANNUAL" exists, and
 * summing every type would add sick and compassionate days to a figure
 * an employee reads as "days I can book a holiday with".
 */
export function useLeaveLeft() {
  return useQuery<LeaveLeft | null>({
    queryKey: ["leave", "left"],
    queryFn: async () => {
      const [balances, types] = await Promise.all([
        http.get<Res<"GET /me/leave/balances">>("/me/leave/balances"),
        http.get<Res<"GET /me/leave/types">>("/me/leave/types"),
      ]);

      const best = [...balances.data].sort((a, b) => b.available - a.available)[0];
      if (!best) return null;

      const type = types.data.find((t) => t._id === best.leaveTypeId);
      if (!type) return null;

      return { days: best.available, typeName: type.name };
    },
    retry: false,
  });
}

export type Holiday = Item<"GET /me/holidays">;

/**
 * The company's public holidays for a year, and the next one too.
 *
 * Both years, always. A request or a tile in December needs January's
 * dates, and fetching only the current year makes the app go blank for
 * the last month of every year — which is exactly when people are
 * booking time off around them.
 *
 * `isWorkingDay` holidays are filtered out: the schema uses it for days
 * that are observed but still worked, which do not shorten leave and
 * should not be announced as a day off.
 *
 * From `/me/holidays`, which needs no permission and already holds only
 * the holidays for this employee's office. `/holidays` is behind
 * `holiday:read`, which an ordinary employee lacks — the leave preview
 * then counted public holidays as working days.
 */
export function useHolidays(year: number) {
  return useQuery<Holiday[]>({
    queryKey: ["holidays", year],
    queryFn: async () => {
      const years = await Promise.all([
        http.get<Res<"GET /me/holidays">>("/me/holidays", { params: { year: String(year) } }),
        http.get<Res<"GET /me/holidays">>("/me/holidays", { params: { year: String(year + 1) } }),
      ]);

      return years
        .flatMap((response) => response.data)
        .filter((holiday) => !holiday.isWorkingDay)
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    // Legislated a year ahead. Refetching on every glance at the clock
    // screen would be a round trip for nothing.
    staleTime: 12 * 60 * 60 * 1000,
    retry: false,
  });
}

/** Alias kept for the leave screens, which want the whole calendar. */
export const useNextHolidays = useHolidays;

/** The next public holiday on or after `today`. */
export function useNextHoliday(today: string) {
  const query = useHolidays(Number(today.slice(0, 4)));
  const next = (query.data ?? []).find((holiday) => holiday.date >= today) ?? null;

  return { ...query, data: query.data ? next : undefined };
}
