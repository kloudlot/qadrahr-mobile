/**
 * The face check, as the app sees it.
 *
 * The app does not look at anyone's face. A sitting is run by a web page —
 * the organisation's own web app, opened in a web view — and judged by the
 * server. The app starts it, waits, and is told how it went; what is here
 * is that conversation, kept free of React so it can be tested.
 */
import type { Res } from "@/lib/api/types";

export type FaceStatus = Res<"GET /me/attendance/face/status">;
export type FaceState = FaceStatus["state"];
export type FacePurpose = "enrol" | "punch";

/** What the capture page tells the app. Mirrors `BridgeMessage` in the web app's lib/face-sitting.ts. */
export type FaceBridgeMessage =
  | { status: "verified"; purpose: FacePurpose; outcome: string }
  | { status: "rejected"; purpose: FacePurpose; reason: string; message: string }
  | { status: "unavailable"; purpose: FacePurpose }
  | { status: "expired" }
  | { status: "cancelled" }
  | { status: "error"; message: string }
  | { status: "speak"; text: string };

const STATUSES = new Set(["verified", "rejected", "unavailable", "expired", "cancelled", "error", "speak"]);

/**
 * Reads a message from the web view, or null for anything that is not one.
 *
 * A web view will pass along whatever the page posts, and pages post all
 * sorts (analytics, dev tools). Anything unrecognised is ignored rather
 * than treated as a result.
 */
export function parseBridgeMessage(raw: unknown): FaceBridgeMessage | null {
  if (typeof raw !== "string") return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const status = (value as { status?: unknown }).status;
  return typeof status === "string" && STATUSES.has(status) ? (value as FaceBridgeMessage) : null;
}

/** How a sitting ended, as far as the screen that opened it is concerned. */
export type SittingResult =
  /**
   * The server has something to say about this sitting. For a punch, send
   * it: whether that is a clean clock-in, one recorded and flagged, or one
   * refused is the server's decision, read from the sitting itself.
   */
  | { kind: "judged"; sessionId: string; verified: boolean; outcome: string | null; message: string | null }
  /** Faces cannot be checked right now. The frames are with the server; a punch will be checked afterwards. */
  | { kind: "unavailable"; sessionId: string }
  /** The employee backed out, or the link timed out. Nothing to send. */
  | { kind: "abandoned" }
  /** The camera or the page failed. Nothing was captured. */
  | { kind: "failed"; message: string };

/** What a terminal message from the page means. `speak` is not terminal and returns null. */
export function sittingResult(message: FaceBridgeMessage, sessionId: string): SittingResult | null {
  switch (message.status) {
    case "verified":
      return { kind: "judged", sessionId, verified: true, outcome: message.outcome, message: null };
    case "rejected":
      return { kind: "judged", sessionId, verified: false, outcome: null, message: message.message };
    case "unavailable":
      return { kind: "unavailable", sessionId };
    case "expired":
    case "cancelled":
      return { kind: "abandoned" };
    case "error":
      return { kind: "failed", message: message.message };
    case "speak":
      return null;
  }
}

/**
 * Whether clock-in should open a sitting first.
 *
 * Only when everything is in place. Someone who has not agreed, not
 * enrolled, or is awaiting review clocks in as before: the server records
 * the punch and flags it, and the app asks them to set up their face
 * rather than standing between them and the gate.
 */
export const needsSitting = (status: FaceStatus | undefined): boolean => status?.state === "ready";

/** Whether to prompt the employee to set up their face check. */
export const needsSetup = (status: FaceStatus | undefined): boolean =>
  status?.state === "needs_consent" || status?.state === "needs_enrolment";
