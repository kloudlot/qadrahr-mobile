import { isAxiosError } from "axios";
import { onlineManager } from "@tanstack/react-query";

import { File } from "expo-file-system";

import { http, errorMessage } from "./api";
import type { Res } from "./api/types";
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
    const faceCaptureKey = punch.selfieUri ? await uploadSelfie(punch.selfieUri) : undefined;
    await http.post("/me/attendance/clock", toRequestBody(punch, faceCaptureKey));
    if (punch.selfieUri) await forgetSelfie(punch.selfieUri);
    return { kind: "accepted" };
  } catch (error) {
    // The photo could not be uploaded: storage was unreachable. The punch
    // waits with its photo rather than going without it.
    if (error instanceof SelfieUploadError) return { kind: "retry" };
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

class SelfieUploadError extends Error {}

/**
 * Uploads the photo taken with an offline punch; returns the key to send
 * as `faceCaptureKey`, or undefined when the photo is no longer on the
 * phone (the OS cleared it) — the punch then goes without one and the
 * server flags it, which is better than a punch that can never be sent.
 */
async function uploadSelfie(uri: string): Promise<string | undefined> {
  if (!new File(uri).exists) return undefined;

  // A 4xx here means the face check does not apply after all (turned off,
  // or not in the plan): send the punch without the photo. Anything else
  // propagates and is classified with the punch's own failures.
  let slot: Res<"POST /me/attendance/face/selfie-slot">;
  try {
    ({ data: slot } = await http.post<Res<"POST /me/attendance/face/selfie-slot">>(
      "/me/attendance/face/selfie-slot",
      { contentType: "image/jpeg" },
    ));
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    if (status && status >= 400 && status < 500 && status !== 401) return undefined;
    throw error;
  }

  const body = await fetch(uri).then((response) => response.blob());
  // Not the app's axios instance: the presigned URL is signed for exactly
  // these headers (see lib/receipts.ts).
  const put = await fetch(slot.uploadUrl, {
    method: "PUT",
    headers: { ...slot.requiredHeaders, "Content-Type": "image/jpeg" },
    body,
  }).catch(() => null);
  if (!put?.ok) throw new SelfieUploadError("upload");
  return slot.key;
}

/** Removes the photo from the phone once its punch is on the server. */
async function forgetSelfie(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Best effort: it is in the app's own cache, which the OS clears anyway.
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
