import { keysForPush } from "./pushRefresh";

describe("keysForPush", () => {
  it("always refreshes the notifications list and count", () => {
    for (const type of [
      "",
      "lifecycle.joined",
      "payslip.ready",
      "workflow.pending",
    ]) {
      expect(keysForPush(type)[0]).toEqual(["notifications"]);
    }
  });

  it("refreshes an approver's inbox for a new step, reminder or escalation", () => {
    expect(keysForPush("workflow.pending")).toContainEqual(["approvals"]);
    expect(keysForPush("workflow.escalated")).toContainEqual(["approvals"]);
  });

  it("refreshes my requests — not the inbox — for a decision", () => {
    const keys = keysForPush("workflow.decided");
    expect(keys).toContainEqual(["requests"]);
    expect(keys).toContainEqual(["leave"]);
    expect(keys).not.toContainEqual(["approvals"]);
  });

  it("refreshes payslips and announcements", () => {
    expect(keysForPush("payslip.ready")).toContainEqual(["payslips"]);
    expect(keysForPush("broadcast.published")).toContainEqual(["broadcasts"]);
  });

  it("refreshes nothing else for a type it has no screen for", () => {
    expect(keysForPush("report.ready")).toEqual([["notifications"]]);
  });
});
