/**
 * Clock-ins that have not reached the server yet.
 *
 * The one piece of this app that can lose an employee's pay, so the
 * decision-making is separated from the I/O: everything below the
 * "reducer" heading is a pure function over a plain array, tested
 * directly, and the storage and network layers do as little thinking as
 * possible.
 *
 * The API was built for this. `clientPunchId` makes a resend free —
 * PunchService looks up `externalId` and returns the SAME punch at 201
 * rather than creating a second one — and `occurredAt` lets a punch
 * captured at 08:00 and delivered at 17:30 still land on the right
 * business date.
 *
 * Persisted by punchQueueStorage.ts, which is the only file here that
 * touches a native module — so this one can be tested as the plain
 * arithmetic it is.
 *
 * That store is AsyncStorage rather than SecureStore, for three reasons in
 * order of weight. SecureStore is a key-value store with a practical
 * ~2KB per-item ceiling on Android, which is the wrong shape for a
 * growing list. A queued punch contains no credential — the worst case
 * on a compromised device is disclosing that an employee was at their
 * own workplace, which their employer already knows and the OS records
 * far more precisely. And the things that could impersonate them, the
 * tokens, stay in SecureStore where lib/storage.ts puts them.
 */

import type { Body } from "./api/types";


export interface QueuedPunch {
  /** Idempotency key, generated at capture. Makes a resend free. */
  clientPunchId: string;
  /** Whose punch this is. Checked again at flush — see `punchesFor`. */
  userId: string;
  /**
   * PINNED at capture, never inferred at send.
   *
   * The single most important field here. The server infers direction as
   * the opposite of the last punch on that business date when it is
   * omitted. A punch captured at 08:00 and flushed at 17:30 — after the
   * employee clocked out on another device, or after a later queued
   * punch landed first — would infer the opposite of what the employee
   * pressed, turning a morning clock-in into an evening clock-out. The
   * button already knows the answer; send it.
   */
  direction: "in" | "out";
  /** ISO, captured locally. Sent only for queued punches — see below. */
  occurredAt: string;
  latitude: number | null;
  longitude: number | null;
  accuracyMetres: number | null;
  /** The phone said the fix came from a mock-location provider. */
  mockedLocation?: boolean;
  /**
   * A photo of the employee's face, taken when the punch was made, where
   * their organisation asks for a face check. A local file: with no
   * connection there can be no sitting, so this is what the server is given
   * instead when the queue syncs. It matches the face but cannot show the
   * person was there, so the punch is flagged for a supervisor.
   */
  selfieUri?: string;
  /** Bumped on every failed send, for backoff and for the UI. */
  attempts: number;
}

/** What a send attempt concluded. */
export type SendOutcome =
  /** Accepted. Remove it. */
  | { kind: "accepted" }
  /**
   * Refused for a reason that will not change — a 4xx. Remove it and
   * tell the employee once. Retrying is how a queue spins forever.
   */
  | { kind: "rejected"; message: string }
  /** Offline, timed out, or 5xx. Keep it and try again later. */
  | { kind: "retry" };

// ── Reducer: pure, and the part worth testing ──────────────────────

/**
 * Adds a punch, keeping the queue in capture order.
 *
 * Sorted by `occurredAt` rather than by arrival because the two can
 * differ: a punch captured offline at 08:00 may be enqueued after one
 * captured at 08:05 if the UI retried out of order, and the server
 * aggregates a day from punch order.
 */
export function enqueue(queue: QueuedPunch[], punch: QueuedPunch): QueuedPunch[] {
  // A repeat of the same clientPunchId is the same punch, not a second
  // one. Replacing rather than appending keeps the queue honest if a
  // caller double-fires.
  const without = queue.filter((q) => q.clientPunchId !== punch.clientPunchId);
  return [...without, punch].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

/** Applies a send outcome. Only `retry` keeps the punch. */
export function applyOutcome(
  queue: QueuedPunch[],
  clientPunchId: string,
  outcome: SendOutcome,
): QueuedPunch[] {
  if (outcome.kind === "retry") {
    return queue.map((q) =>
      q.clientPunchId === clientPunchId ? { ...q, attempts: q.attempts + 1 } : q,
    );
  }

  // Accepted and rejected both leave. An accepted punch is on the
  // server; a rejected one never will be, and keeping it would re-raise
  // the same refusal on every launch.
  return queue.filter((q) => q.clientPunchId !== clientPunchId);
}

/**
 * The punches belonging to one user, oldest first.
 *
 * A shared shift device is why this filter exists. An unflushed punch
 * belonging to the previous employee would otherwise be sent under the
 * next employee's bearer token and attributed to them — a buddy-punch
 * the app created by itself.
 */
export function punchesFor(queue: QueuedPunch[], userId: string): QueuedPunch[] {
  return queue.filter((q) => q.userId === userId);
}

/**
 * The punch the employee pressed most recently that the server has not
 * seen, or null when nothing is waiting.
 *
 * While anything is queued, THIS decides what the clock button shows, not
 * the server's day. The server cannot know about a punch it has not
 * received: after an offline clock-out it still says "clocked in", and a
 * button that believed it would offer "Clock out" again — a second tap
 * queues a second out, and the employee's day is now two outs and no in.
 */
export function latestPending(queue: QueuedPunch[], userId: string): QueuedPunch | null {
  return punchesFor(queue, userId).at(-1) ?? null;
}

/** Drops everything belonging to one user. Called on sign-out. */
export function forgetUser(queue: QueuedPunch[], userId: string): QueuedPunch[] {
  return queue.filter((q) => q.userId !== userId);
}

/**
 * Whether a punch is due, given exponential backoff on failures.
 *
 * Backoff is measured from `occurredAt` plus the attempts made, rather
 * than from a stored "next attempt" timestamp, so it survives a restart
 * without another field to keep consistent.
 */
export function isDue(punch: QueuedPunch, now: number): boolean {
  if (punch.attempts === 0) return true;
  const delayMs = Math.min(2 ** punch.attempts, 64) * 1000;
  return now - Date.parse(punch.occurredAt) >= delayMs;
}

/**
 * The request body for a queued punch.
 *
 * `occurredAt` is included here and deliberately NOT sent for a live
 * punch: letting the server timestamp the common case removes device
 * clock skew from it entirely. Skew only matters for a punch genuinely
 * captured earlier, and there the server's five-minute future tolerance
 * is the exposure.
 *
 * KNOWN LIMIT, written down rather than left to a support ticket: a
 * device whose clock is fast at capture AND still fast at flush keeps
 * `occurredAt` beyond that tolerance, and the punch is rejected
 * permanently. Clamping to min(occurredAt, now) at flush only helps if
 * the user fixed their clock in between. Solving it properly means
 * deriving an offset from a response `Date` header and applying it at
 * capture. Not worth it yet; worth knowing.
 */
/**
 * The clock request as the queue sends it: the API's own body, except that
 * location is null rather than absent when there was no fix — the API's
 * validators treat the two alike (see the test). Everything else is the
 * contract's, so a renamed field still fails to compile.
 */
type ClockBody = Omit<Body<"POST /me/attendance/clock">, "latitude" | "longitude" | "accuracyMetres"> & {
  latitude: number | null;
  longitude: number | null;
  accuracyMetres: number | null;
};

/**
 * `faceCaptureKey` is where the queued photo ended up, once it has been
 * uploaded. The local path never goes to the server.
 */
export function toRequestBody(punch: QueuedPunch, faceCaptureKey?: string): ClockBody {
  return {
    clientPunchId: punch.clientPunchId,
    direction: punch.direction,
    occurredAt: punch.occurredAt,
    latitude: punch.latitude,
    longitude: punch.longitude,
    accuracyMetres: punch.accuracyMetres,
    ...(punch.mockedLocation ? { mockedLocation: true } : {}),
    ...(faceCaptureKey ? { faceCaptureKey } : {}),
  };
}
