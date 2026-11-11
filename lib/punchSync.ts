import { isAxiosError } from "axios";
import { onlineManager } from "@tanstack/react-query";

import { http, errorMessage } from "./api";
import {
  applyOutcome,
  enqueue,
  forgetUser,
  isDue,
  punchesFor,
  toRequestBody,
  type QueuedPunch,
  type SendOutcome,
} from "./punchQueue";
import { readQueue, writeQueue } from "./punchQueueStorage";

/**
 * Getting queued punches to the server.
 *
 * All the I/O the queue needs, and none of the decisions — those live in
 * punchQueue.ts, where they can be tested without a device.
 */

/** What a permanently-rejected punch needs to say to the employee. */
export interface RejectedPunch {
  occurredAt: string;
  direction: "in" | "out";
  message: string;
}

type RejectionListener = (rejected: RejectedPunch) => void;

let onRejected: RejectionListener | null = null;

export function setRejectionListener(listener: RejectionListener | null): void {
  onRejected = listener;
}

/**
 * The in-flight flush, if there is one.
 *
 * Same single-flight shape as the token refresh in api.ts, and for the
 * same reason: NetInfo, AppState and a successful live punch can all
 * fire within a second of each other, and three concurrent flushes of
 * the same queue would send each punch three times. `clientPunchId`
 * makes that harmless on the server, but it is still three round trips
 * and an unpredictable final ordering.
 */
let inFlight: Promise<void> | null = null;

export async function addToQueue(punch: QueuedPunch): Promise<void> {
  await writeQueue(enqueue(await readQueue(), punch));
}

/** One employee's waiting punches, oldest first. */
export async function queuedPunches(userId: string): Promise<QueuedPunch[]> {
  return punchesFor(await readQueue(), userId);
}

/** Drops one employee's queued punches. Called on sign-out. */
export async function forgetQueuedPunches(userId: string): Promise<void> {
  await writeQueue(forgetUser(await readQueue(), userId));
}

/**
 * Sends one punch and classifies the result.
 *
 * The classification is the whole point, and the 401 case is the subtle
 * one: it is NOT a rejection. api.ts refreshes and retries once on its
 * own, so a 401 arriving here means the session is genuinely over — the
 * punch should wait on disk for the next sign-in rather than be
 * discarded.
 */
async function send(punch: QueuedPunch): Promise<SendOutcome> {
  try {
    await http.post("/me/attendance/clock", toRequestBody(punch));
    return { kind: "accepted" };
  } catch (error) {
    if (!isAxiosError(error)) return { kind: "retry" };

    const status = error.response?.status;

    // No response at all — offline, DNS, timeout.
    if (!status) return { kind: "retry" };
    if (status === 401) return { kind: "retry" };
    if (status >= 500) return { kind: "retry" };

    if (status >= 400) return { kind: "rejected", message: errorMessage(error) };

    return { kind: "retry" };
  }
}

/**
 * Flushes one user's queue, oldest first, one at a time.
 *
 * SERIAL on purpose. Punches arriving out of order interact badly with
 * day aggregation — the server pairs ins and outs by time, and a later
 * punch landing before an earlier one can briefly produce an unpaired
 * count that the UI then renders. Sending one at a time also means a
 * failure leaves a state that can be reasoned about: everything before
 * it is delivered, everything after is untouched.
 */
export function flushQueue(userId: string): Promise<void> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      if (!onlineManager.isOnline()) return;

      const now = Date.now();
      const due = punchesFor(await readQueue(), userId).filter((p) => isDue(p, now));

      for (const punch of due) {
        const outcome = await send(punch);

        // Re-read before writing: the live clock path may have enqueued
        // something while this loop was awaiting the network.
        await writeQueue(applyOutcome(await readQueue(), punch.clientPunchId, outcome));

        if (outcome.kind === "rejected") {
          onRejected?.({
            occurredAt: punch.occurredAt,
            direction: punch.direction,
            message: outcome.message,
          });
        }

        // Stop on the first retry. Continuing would send later punches
        // ahead of an earlier one that has not landed, which is the
        // ordering problem this loop exists to avoid.
        if (outcome.kind === "retry") break;
      }
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
