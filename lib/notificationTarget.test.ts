import { notificationTarget } from "./notificationTarget";

describe("notificationTarget", () => {
  it("follows the server's path to this app's screen", () => {
    expect(
      notificationTarget({
        type: "workflow.decided",
        data: { path: "/me/expenses" },
      }),
    ).toBe("/expenses");
    expect(
      notificationTarget({
        type: "workflow.pending",
        data: { path: "/workflow/approvals" },
      }),
    ).toBe("/approvals");
  });

  it("opens approvals for anything waiting on me, path or not", () => {
    expect(notificationTarget({ type: "workflow.pending" })).toBe("/approvals");
    expect(notificationTarget({ type: "workflow.reminder", data: {} })).toBe(
      "/approvals",
    );
    expect(notificationTarget({ type: "approval.pending" })).toBe("/approvals");
  });

  it("falls back on the type when a path has no screen here", () => {
    // Delegation is web-only; the decision still has somewhere to go.
    expect(
      notificationTarget({
        type: "workflow.decided",
        data: { path: "/workflow/delegation" },
      }),
    ).toBe("/requests");
  });

  it("opens loans, cases and policies on their own screens", () => {
    expect(
      notificationTarget({
        type: "workflow.decided",
        data: { path: "/me/loans" },
      }),
    ).toBe("/loans");
    expect(
      notificationTarget({
        type: "er.response_due",
        data: { path: "/me/cases" },
      }),
    ).toBe("/cases");
  });

  it("opens the payslip itself when it is named", () => {
    expect(
      notificationTarget({ type: "payslip.ready", data: { payslipId: "p1" } }),
    ).toBe("/pay/p1");
    expect(notificationTarget({ type: "payslip.ready" })).toBe("/pay");
  });

  it("handles a push's flat payload", () => {
    expect(
      notificationTarget({
        type: "broadcast.published",
        data: { broadcastId: "b1" },
      }),
    ).toBe("/announcements/b1");
    expect(notificationTarget({ data: { assetId: "a1" } })).toBe("/assets");
  });

  it("opens performance, and a manager's team reviews", () => {
    expect(
      notificationTarget({
        type: "performance.self_review",
        data: { path: "/me/performance" },
      }),
    ).toBe("/performance");
    expect(
      notificationTarget({
        type: "performance.manager_review",
        data: { path: "/me/team/performance" },
      }),
    ).toBe("/performance/team");
    expect(notificationTarget({ type: "performance.goals_set" })).toBe(
      "/performance",
    );
  });

  it("stays put for what it can't show", () => {
    expect(notificationTarget({ type: "er.case_raised" })).toBeNull();
    expect(notificationTarget({})).toBeNull();
  });

  it("opens the payslip a push names, even with the list's path", () => {
    expect(
      notificationTarget({
        type: "payslip.ready",
        data: { path: "/me/payslips", payslipId: "p1" },
      }),
    ).toBe("/pay/p1");
    expect(notificationTarget({ type: "payslip.ready", data: { path: "/me/payslips" } })).toBe("/pay");
  });

  it("opens the announcement in a path with a query string", () => {
    expect(
      notificationTarget({
        type: "broadcast.published",
        data: { path: "/me/announcements?broadcast=b42" },
      }),
    ).toBe("/announcements/b42");
    expect(notificationTarget({ type: "broadcast.published", data: { path: "/me/announcements" } })).toBe(
      "/announcements",
    );
  });

  it("opens my cases for an employee's case update, by its path", () => {
    // A handler's case notices link to the web case file instead.
    expect(notificationTarget({ type: "er.hearing_scheduled", data: { path: "/me/cases" } })).toBe("/cases");
    expect(notificationTarget({ type: "er.case_raised", data: { path: "/er/cases/c1" } })).toBeNull();
  });

  it("has no screen for HR-only pages — the caller opens the list", () => {
    expect(notificationTarget({ type: "new_hire.submitted", data: { path: "/employees/new-hires/x" } })).toBeNull();
  });
});
