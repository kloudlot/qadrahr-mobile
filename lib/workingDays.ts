/**
 * Working-day arithmetic, ported from the server's
 * `common/date/business-date.ts`.
 *
 * Same reason as `lib/geo.ts`: the number on screen has to be the number
 * the server records. "5 working days" that turns into 6 on submit is
 * worse than no preview at all — the employee budgeted their balance on
 * the first figure and finds out afterwards.
 *
 * This is a PREVIEW. The server recomputes on submit and is the only
 * authority; `LeaveRequestResponseDto.days` is what actually counts. The
 * preview exists so someone can see the cost before committing to it.
 *
 * Dates are `YYYY-MM-DD` throughout and compared as strings, never as
 * Date objects in local time — a `new Date("2026-10-01")` is midnight
 * UTC, which is the previous day west of Greenwich, and that shifts a
 * whole request by one.
 */

export type BusinessDate = string;

/**
 * **0 = Sunday**, through 6 = Saturday.
 *
 * The JavaScript convention, not ISO, because that is what the server
 * uses and what `Company.workDays` stores — its own comment says "0 =
 * Sunday". Getting this backwards costs a day on any request touching a
 * weekend at a company that works Saturdays, which the schema notes is
 * common in retail.
 */
export function dayOfWeek(date: BusinessDate): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function addDays(date: BusinessDate, days: number): BusinessDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isAfter(a: BusinessDate, b: BusinessDate): boolean {
  return a > b;
}

/** Every date in the range, inclusive. */
export function datesBetween(from: BusinessDate, to: BusinessDate): BusinessDate[] {
  if (isAfter(from, to)) return [];

  const dates: BusinessDate[] = [];
  for (let cursor = from; !isAfter(cursor, to); cursor = addDays(cursor, 1)) {
    dates.push(cursor);
  }
  return dates;
}

export interface WorkingDayOptions {
  /** Days worked, 0 = Sunday. Defaults to Monday–Friday. */
  workDays?: number[];
  /** `YYYY-MM-DD` public holidays falling in the range. */
  holidays?: string[];
}

const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];

export function countWorkingDays(
  from: BusinessDate,
  to: BusinessDate,
  options: WorkingDayOptions = {},
): number {
  const workDays = options.workDays ?? DEFAULT_WORK_DAYS;
  const holidays = new Set(options.holidays ?? []);

  if (isAfter(from, to)) return 0;

  let count = 0;
  for (let cursor = from; !isAfter(cursor, to); cursor = addDays(cursor, 1)) {
    if (workDays.includes(dayOfWeek(cursor)) && !holidays.has(cursor)) {
      count += 1;
    }
  }
  return count;
}

/** Inclusive calendar days, for leave types that run in calendar days. */
export function inclusiveDayCount(from: BusinessDate, to: BusinessDate): number {
  if (isAfter(from, to)) return 0;
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

/**
 * What a request will cost, mirroring the server's `calculateDays`.
 *
 * The half-day rule is the server's, including the detail that a
 * half-day END on a single-day request is ignored — otherwise a one-day
 * request with both halves marked would come to zero.
 */
export function previewDays(input: {
  startDate: BusinessDate;
  endDate: BusinessDate;
  workDays?: number[];
  holidays?: string[];
  /** False for maternity and similar, which run in calendar days. */
  excludesNonWorkingDays: boolean;
  allowHalfDays: boolean;
  halfDayStart?: boolean;
  halfDayEnd?: boolean;
}): number {
  if (!input.excludesNonWorkingDays) {
    return inclusiveDayCount(input.startDate, input.endDate);
  }

  let days = countWorkingDays(input.startDate, input.endDate, {
    workDays: input.workDays,
    holidays: input.holidays,
  });

  if (input.allowHalfDays) {
    if (input.halfDayStart) days -= 0.5;
    if (input.halfDayEnd && input.endDate !== input.startDate) days -= 0.5;
  }

  return Math.max(0, days);
}

/**
 * The non-working dates inside a range, for the "excluded automatically"
 * line. Named where a holiday has one, so the copy can say which.
 */
export function excludedDates(
  from: BusinessDate,
  to: BusinessDate,
  options: { workDays?: number[]; holidays?: Record<string, string> } = {},
): { date: BusinessDate; reason: string }[] {
  const workDays = options.workDays ?? DEFAULT_WORK_DAYS;
  const holidays = options.holidays ?? {};

  return datesBetween(from, to)
    .map((date) => {
      const holidayName = holidays[date];
      if (holidayName) return { date, reason: holidayName };
      if (!workDays.includes(dayOfWeek(date))) return { date, reason: "weekend" };
      return null;
    })
    .filter((entry): entry is { date: BusinessDate; reason: string } => entry !== null);
}
