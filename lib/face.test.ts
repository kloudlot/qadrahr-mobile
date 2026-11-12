import { needsSetup, needsSitting, parseBridgeMessage, sittingResult, type FaceStatus } from "./face";

describe("the face check bridge", () => {
  describe("parseBridgeMessage", () => {
    it("reads what the capture page sends", () => {
      expect(parseBridgeMessage(JSON.stringify({ status: "verified", purpose: "punch", outcome: "verified" }))).toEqual({
        status: "verified",
        purpose: "punch",
        outcome: "verified",
      });
      expect(parseBridgeMessage('{"status":"cancelled"}')).toEqual({ status: "cancelled" });
    });

    it("ignores anything that is not one of its messages", () => {
      expect(parseBridgeMessage("not json")).toBeNull();
      expect(parseBridgeMessage('{"type":"analytics"}')).toBeNull();
      expect(parseBridgeMessage('{"status":"hacked"}')).toBeNull();
      expect(parseBridgeMessage("null")).toBeNull();
      expect(parseBridgeMessage('"verified"')).toBeNull();
      expect(parseBridgeMessage(undefined)).toBeNull();
      expect(parseBridgeMessage({ status: "verified" })).toBeNull();
    });
  });

  describe("sittingResult", () => {
    it("sends a verified sitting on to the punch", () => {
      expect(sittingResult({ status: "verified", purpose: "punch", outcome: "uncertain" }, "s1")).toEqual({
        kind: "judged",
        sessionId: "s1",
        verified: true,
        outcome: "uncertain",
        message: null,
      });
    });

    it("sends a rejected sitting on too: what the punch is worth is the server's call", () => {
      expect(
        sittingResult({ status: "rejected", purpose: "punch", reason: "no_match", message: "Not you." }, "s1"),
      ).toEqual({ kind: "judged", sessionId: "s1", verified: false, outcome: null, message: "Not you." });
    });

    it("carries on when faces cannot be checked, naming the sitting whose frames are stored", () => {
      expect(sittingResult({ status: "unavailable", purpose: "punch" }, "s1")).toEqual({
        kind: "unavailable",
        sessionId: "s1",
      });
    });

    it("sends nothing when the employee backs out or the link times out", () => {
      expect(sittingResult({ status: "cancelled" }, "s1")).toEqual({ kind: "abandoned" });
      expect(sittingResult({ status: "expired" }, "s1")).toEqual({ kind: "abandoned" });
    });

    it("reports a camera or page failure", () => {
      expect(sittingResult({ status: "error", message: "No camera" }, "s1")).toEqual({
        kind: "failed",
        message: "No camera",
      });
    });

    it("does not treat an instruction to read aloud as an ending", () => {
      expect(sittingResult({ status: "speak", text: "Blink" }, "s1")).toBeNull();
    });
  });

  describe("what clock-in does", () => {
    const status = (state: FaceStatus["state"]) => ({ state }) as FaceStatus;

    it("opens a sitting only when the employee is fully set up", () => {
      expect(needsSitting(status("ready"))).toBe(true);
      for (const state of ["off", "unavailable", "needs_consent", "needs_enrolment", "awaiting_review"] as const) {
        expect(needsSitting(status(state))).toBe(false);
      }
      expect(needsSitting(undefined)).toBe(false);
    });

    it("prompts for set-up when agreement or enrolment is missing, and not while HR is reviewing", () => {
      expect(needsSetup(status("needs_consent"))).toBe(true);
      expect(needsSetup(status("needs_enrolment"))).toBe(true);
      expect(needsSetup(status("awaiting_review"))).toBe(false);
      expect(needsSetup(status("ready"))).toBe(false);
      expect(needsSetup(status("off"))).toBe(false);
    });
  });
});
