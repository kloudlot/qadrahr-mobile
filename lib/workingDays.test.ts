import { countWorkingDays, dayOfWeek, inclusiveDayCount, previewDays } from "./workingDays";

/**
 * The working-day port, checked against the server.
 *
 * Every expected value below was produced by running the backend's
 * `src/common/date/business-date.ts` on the same inputs. A
 * self-consistent port would pass while still disagreeing with the
 * authority — and here the disagreement costs an employee a day of
 * leave, which they would only discover after submitting.
 *
 * Writing these caught a real one: the server uses the JavaScript day
 * convention (0 = Sunday) and the first draft of the port used ISO
 * (7 = Sunday). Harmless for a Monday-to-Friday company and wrong by a
 * day for any company that works Saturdays, which `Company.workDays`
 * notes is common in retail.
 */

/** 1 October 2026 is a public holiday, and falls on a Thursday. */
const HOLIDAYS = ["2026-10-01"];

describe("dayOfWeek", () => {
  it("uses the server's convention, not ISO", () => {
    expect(dayOfWeek("2026-09-28")).toBe(1); // Monday
    expect(dayOfWeek("2026-09-27")).toBe(0); // Sunday — 0, not 7
    expect(dayOfWeek("2026-09-26")).toBe(6); // Saturday
  });
});

describe("countWorkingDays", () => {
  it("excludes a public holiday", () => {
    // Mon 28 Sep – Fri 2 Oct, with Thursday a holiday.
    expect(countWorkingDays("2026-09-28", "2026-10-02", { holidays: HOLIDAYS })).toBe(4);
  });

  it("counts the same week without one", () => {
    expect(countWorkingDays("2026-09-28", "2026-10-02")).toBe(5);
  });

  it("excludes a weekend", () => {
    // Fri 25 Sep – Mon 28 Sep is two working days, not four.
    expect(countWorkingDays("2026-09-25", "2026-09-28")).toBe(2);
  });

  it("counts Saturday for a six-day company", () => {
    // The case the convention bug would have broken. Mon 28 Sep – Sat 3
    // Oct at a company working 1–6 is six days.
    expect(countWorkingDays("2026-09-28", "2026-10-03", { workDays: [1, 2, 3, 4, 5, 6] })).toBe(6);
  });

  it("is zero for a reversed range", () => {
    expect(countWorkingDays("2026-10-02", "2026-09-28")).toBe(0);
  });

  it("is zero for a single non-working day", () => {
    expect(countWorkingDays("2026-09-26", "2026-09-26")).toBe(0);
  });
});

describe("inclusiveDayCount", () => {
  it("counts both ends", () => {
    expect(inclusiveDayCount("2026-09-28", "2026-10-02")).toBe(5);
  });
});

describe("previewDays", () => {
  const base = {
    startDate: "2026-09-28",
    endDate: "2026-10-02",
    holidays: HOLIDAYS,
    excludesNonWorkingDays: true,
    allowHalfDays: true,
  };

  it("matches the server for a normal request", () => {
    expect(previewDays(base)).toBe(4);
  });

  it("takes half a day off each marked end", () => {
    expect(previewDays({ ...base, halfDayStart: true })).toBe(3.5);
    expect(previewDays({ ...base, halfDayStart: true, halfDayEnd: true })).toBe(3);
  });

  it("ignores a half-day end on a single-day request", () => {
    // The server's rule. Without it, one day with both halves marked
    // would come to zero — a request that costs nothing.
    const oneDay = { ...base, startDate: "2026-09-28", endDate: "2026-09-28" };

    expect(previewDays({ ...oneDay, halfDayStart: true, halfDayEnd: true })).toBe(0.5);
  });

  it("ignores half-days on a type that does not allow them", () => {
    expect(previewDays({ ...base, allowHalfDays: false, halfDayStart: true })).toBe(4);
  });

  it("counts calendar days for maternity and similar", () => {
    // `excludesNonWorkingDays: false` — weekends and holidays are inside
    // the leave, not deducted from it.
    expect(previewDays({ ...base, excludesNonWorkingDays: false })).toBe(5);
  });

  it("never returns a negative", () => {
    const oneDay = { ...base, startDate: "2026-10-01", endDate: "2026-10-01" };

    // A single day that is itself the holiday, with a half-day marked.
    expect(previewDays({ ...oneDay, halfDayStart: true })).toBe(0);
  });
});
