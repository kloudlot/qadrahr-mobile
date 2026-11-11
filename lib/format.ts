/**
 * Display formatting shared by the screens. Dates the API sends as
 * YYYY-MM-DD are CALENDAR dates, and are always read as local midnight —
 * never as UTC, which shows the previous day west of Greenwich.
 */

/** A YYYY-MM-DD calendar date as a local Date. */
export function calendarDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** YYYY-MM-DD for a local Date. */
export function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `7h 45m`, `45m`, `8h`. Empty-ish values read as a dash rather than "0m". */
export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "—";
  const whole = Math.round(minutes);
  const h = Math.floor(whole / 60);
  const m = whole % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** `17:05`, in the phone's clock. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** `Mon 21 Sep` for a calendar date. */
export function formatDay(date: string): string {
  return calendarDate(date).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

/** `21 Sep 2026` for a calendar date or an instant. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? calendarDate(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

/** The first and last calendar day of the month containing `anchor`. */
export function monthRange(anchor: Date): { from: string; to: string } {
  return {
    from: isoDate(new Date(anchor.getFullYear(), anchor.getMonth(), 1)),
    to: isoDate(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)),
  };
}

/** `September 2026`. */
export function monthLabel(anchor: Date): string {
  return anchor.toLocaleDateString([], { month: "long", year: "numeric" });
}

/** A local date and a `HH:mm` time as the UTC instant the API takes. */
export function instantFrom(date: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const local = calendarDate(date);
  local.setHours(h ?? 0, m ?? 0, 0, 0);
  return local.toISOString();
}

/** `4m`, `3h`, `2d`. Absolute past a week, where "9d" stops helping. */
export function relativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)}h ago`;
  if (seconds < 604_800) return `${Math.round(seconds / 86_400)}d ago`;

  return new Date(then).toLocaleDateString([], { day: "numeric", month: "short" });
}
