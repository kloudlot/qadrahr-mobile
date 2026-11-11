import { calendarDate, formatMinutes, instantFrom, isoDate, monthRange } from "./format";

describe("format", () => {
  it("reads a calendar date as local midnight, not UTC", () => {
    const d = calendarDate("2026-09-01");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 8, 1, 0]);
    expect(isoDate(d)).toBe("2026-09-01");
  });

  it("formats durations", () => {
    expect(formatMinutes(0)).toBe("—");
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(480)).toBe("8h");
    expect(formatMinutes(465)).toBe("7h 45m");
  });

  it("finds a month's first and last day, including a leap February", () => {
    expect(monthRange(new Date(2028, 1, 10))).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(monthRange(new Date(2026, 11, 31))).toEqual({ from: "2026-12-01", to: "2026-12-31" });
  });

  it("builds the instant for a local date and time", () => {
    const iso = instantFrom("2026-09-21", "17:05");
    const back = new Date(iso);
    expect([back.getDate(), back.getHours(), back.getMinutes()]).toEqual([21, 17, 5]);
  });
});
