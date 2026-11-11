import { useCallback, useEffect, useMemo, useState } from "react";
import { onlineManager, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { isAxiosError } from "axios";

import { http, errorMessage } from "./api";
import type { Res } from "@/lib/api/types";
import { checkGeofence, metresOutside } from "./geo";
import {
  attendanceKeys,
  useMyShift,
  usePunches,
  useToday,
  useWorkLocation,
} from "./queries/attendance";
import type { AttendanceDay, MyShift, PunchEvent, WorkLocation } from "./queries/attendance";
import { latestPending, type QueuedPunch } from "./punchQueue";
import { addToQueue, flushQueue, queuedPunches } from "./punchSync";
import { useCurrentPosition, type PositionState } from "./useCurrentPosition";

/**
 * The clock screen's state, in one place.
 *
 * Everything here is derived from server data and, while punches are
 * waiting to send, from the on-disk queue. Nothing about whether someone
 * is clocked in is mirrored into memory — two copies of that fact is how
 * a screen ends up showing a running timer for a session the server
 * closed an hour ago, or "Not clocked in" after a force-quit with a
 * clock-in still queued.
 */

/**
 * Used only when nobody has rostered the caller.
 *
 * Not a schedule — a scale for the bar so it has some length at all.
 * The screen says "no schedule" in that case rather than presenting
 * this as the employee's day, which is what the previous hardcoded
 * version got wrong for every part-time employee.
 */
const UNROSTERED_SCALE_MINUTES = 480;

export type ClockIssue =
  | { kind: "outside_geofence"; metres: number; branchName: string }
  | { kind: "location_off"; reason: "denied" | "disabled"; branchName: string | null }
  | { kind: "queued"; at: string }
  | { kind: "already_clocked_in"; since: string }
  | { kind: "rejected"; message: string };

/**
 * Whether a session is open.
 *
 * `unpairedPunches > 0`, not `firstIn && !lastOut`. Someone who clocked
 * out for lunch and back in has both set, and the naive test would call
 * them clocked out for the rest of the afternoon.
 */
function isClockedIn(day: AttendanceDay | null | undefined): boolean {
  return (day?.unpairedPunches ?? 0) > 0;
}

/** The `in` that has no matching `out`, which is what a timer runs from. */
function openPunchAt(punches: PunchEvent[] | undefined): string | null {
  if (!punches?.length) return null;

  // Walk backwards: the first `in` encountered before any `out` is the
  // one still open.
  for (let i = punches.length - 1; i >= 0; i -= 1) {
    const punch = punches[i];
    if (!punch) continue;
    if (punch.direction === "out") return null;
    if (punch.direction === "in") return punch.occurredAt;
  }
  return null;
}

interface ClockState {
  clockedIn: boolean;
  /** Minutes worked today, ticking while a session is open. */
  elapsedMinutes: number;
  /** 0–1 against the rostered shift, or against a nominal day when none. */
  progress: number;
  openedAt: string | null;
  /** Null when nobody has rostered the caller — see the screen's copy. */
  shift: MyShift | undefined;
  day: AttendanceDay | null | undefined;
  workLocation: WorkLocation | undefined;
  position: PositionState;
  /** A punch captured but not yet delivered. */
  pendingOffline: boolean;
  /** A live punch shown as done while the server confirms it. */
  saving: boolean;
  isLoading: boolean;
  issue: ClockIssue | null;
  dismissIssue: () => void;
  /** Sends the punch, after any pre-flight the caller already accepted. */
  punch: (options?: { force?: boolean }) => void;
  isPunching: boolean;
  /** A 201 that came back flagged. Shown inline, not as a sheet. */
  warning: string | null;
}

export function useClock(businessDate: string, userId: string | undefined): ClockState {
  const queryClient = useQueryClient();
  const position = useCurrentPosition();

  const today = useToday(businessDate);
  const punches = usePunches(businessDate);
  const workLocation = useWorkLocation();
  const shift = useMyShift(businessDate);

  const queued = usePunchQueue(userId);
  // The punch just sent, shown as done before the server answers — the
  // employee at the gate sees the change at once, not after two round
  // trips. Cleared when the server's own state lands, or rolled back on
  // failure.
  const [optimistic, setOptimistic] = useState<{ direction: "in" | "out"; at: string } | null>(null);

  const [issue, setIssue] = useState<ClockIssue | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // A waiting punch outranks the server's day: the server has not seen it.
  const pending = latestPending(queued.data ?? [], userId ?? "");
  const pendingOffline = pending !== null;
  const clockedIn = optimistic
    ? optimistic.direction === "in"
    : pending
      ? pending.direction === "in"
      : isClockedIn(today.data);
  const openedAt = optimistic
    ? optimistic.direction === "in"
      ? optimistic.at
      : null
    : pending
      ? pending.direction === "in"
        ? pending.occurredAt
        : null
      : openPunchAt(punches.data);

  // Ticks the DISPLAY only. The anchor is always server data — a timer
  // that counted its own seconds would drift from the payslip.
  useEffect(() => {
    if (!clockedIn) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [clockedIn]);

  const elapsedMinutes = useMemo(() => {
    const banked = today.data?.workedMinutes ?? 0;
    if (!clockedIn || !openedAt) return banked;
    const open = Math.max(0, (now - Date.parse(openedAt)) / 60_000);
    return banked + open;
  }, [today.data?.workedMinutes, clockedIn, openedAt, now]);

  const mutation = useMutation({
    mutationFn: async (force: boolean) => {
      const fence = workLocation.data?.geofence ?? null;
      const coordinates = position.coordinates;

      // Pre-flight selects COPY and offers a confirmation. It never
      // blocks the punch: PunchService records and flags an out-of-fence
      // punch rather than refusing it, and a client stricter than the
      // system it is a client of would be wrong.
      if (!force && fence && coordinates) {
        const check = checkGeofence(coordinates, fence, position.accuracyMetres ?? 0);
        if (!check.withinFence) {
          throw new PreflightStop({
            kind: "outside_geofence",
            metres: metresOutside(check, fence),
            branchName: workLocation.data?.name ?? "your workplace",
          });
        }
      }

      if (!force && (position.status === "denied" || position.status === "disabled")) {
        throw new PreflightStop({
          kind: "location_off",
          reason: position.status,
          branchName: workLocation.data?.name ?? null,
        });
      }

      const direction: "in" | "out" = clockedIn ? "out" : "in";

      // Earlier punches go first. A live punch sent while an older one
      // is still queued lands ahead of it — an offline clock-in followed
      // by a live clock-out reaches the server as out-then-in, and the
      // day pairs backwards. So flush first, and if anything is still
      // stuck, queue this one behind it rather than overtake.
      let mustQueue = !onlineManager.isOnline();
      if (!mustQueue && userId && (await queuedPunches(userId)).length > 0) {
        await flushQueue(userId);
        mustQueue = (await queuedPunches(userId)).length > 0;
      }

      // A freshness check before committing, and the reason for it is
      // specific: there is no 409 anywhere on this path, and the server
      // infers an omitted direction as the opposite of the last punch.
      // So a client acting on stale state does not get an error — it
      // gets a punch in the wrong direction, silently. Someone who
      // clocked in at a kiosk and then opens the app before it refetches
      // would turn their clock-in into a clock-out by pressing the
      // button the screen was showing them.
      //
      // One small GET against a ten-second budget, only when sending live.
      // Skipped when queueing behind a stuck punch: the server's day is
      // missing that punch, so comparing against it would be wrong.
      if (!force && !mustQueue) {
        const fresh = await queryClient.fetchQuery({
          queryKey: attendanceKeys.day(businessDate),
          queryFn: async () => {
            const { data } = await http.get<Res<"GET /me/attendance">>("/me/attendance", {
              params: { from: businessDate, to: businessDate, limit: 1 },
            });
            return data.data[0] ?? null;
          },
          staleTime: 0,
        });

        if (isClockedIn(fresh) && direction === "in") {
          throw new PreflightStop({
            kind: "already_clocked_in",
            since: fresh?.firstIn ?? "",
          });
        }
      }

      const body = {
        direction,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        accuracyMetres: position.accuracyMetres ?? null,
      };

      // Offline (or behind a stuck punch): queue it and say so. The punch
      // is safe, which is why screen 03 treats this as reassurance rather
      // than a failure.
      if (mustQueue) {
        const occurredAt = new Date().toISOString();
        await addToQueue({
          ...body,
          clientPunchId: newPunchId(),
          userId: userId ?? "",
          occurredAt,
          attempts: 0,
        });
        return { queued: true as const, occurredAt, direction };
      }

      // Every check has passed: show it as done. Set here, not on the
      // tap, so a geofence question never flips the card and back.
      setOptimistic({ direction, at: new Date().toISOString() });

      // `occurredAt` is deliberately omitted for a live punch — letting
      // the server timestamp removes device clock skew from the common
      // path entirely.
      const { data } = await http.post<Res<"POST /me/attendance/clock">>("/me/attendance/clock", {
        clientPunchId: newPunchId(),
        ...body,
      });

      return { queued: false as const, warning: data.warning ?? null, direction };
    },

    onSuccess: async (result) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (result.queued) {
        setIssue({ kind: "queued", at: result.occurredAt });
        if (userId) await queryClient.invalidateQueries({ queryKey: attendanceKeys.queue(userId) });
        return;
      }

      // Surfaced inline on the card, not as a sheet — the punch
      // succeeded, and a modal would say otherwise.
      setWarning(result.warning);
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      // The server's state has landed; it takes over from the guess.
      setOptimistic(null);
    },

    onError: (error) => {
      // Roll back: the card shows what the server has, not what was hoped.
      setOptimistic(null);
      if (error instanceof PreflightStop) {
        setIssue(error.issue);
        return;
      }

      // A transport failure after the online check — the connection died
      // mid-request. Treated as a refusal rather than silently queued,
      // because the server may well have recorded it.
      if (isAxiosError(error) && !error.response) {
        setIssue({ kind: "rejected", message: "That didn't send. Check your signal and try again." });
        return;
      }

      setIssue({ kind: "rejected", message: errorMessage(error) });
    },
  });

  const punch = useCallback(
    (options?: { force?: boolean }) => {
      setWarning(null);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      mutation.mutate(options?.force ?? false);
    },
    [mutation],
  );

  return {
    clockedIn,
    elapsedMinutes,
    progress: Math.min(
      1,
      elapsedMinutes / (shift.data?.scheduledMinutes ?? UNROSTERED_SCALE_MINUTES),
    ),
    openedAt,
    day: today.data,
    shift: shift.data,
    workLocation: workLocation.data,
    position,
    pendingOffline,
    saving: optimistic !== null,
    // The queue read is local and quick, but showing the button before it
    // lands is how a queued clock-in briefly reads as "Clock in" again.
    isLoading: today.isLoading || workLocation.isLoading || queued.isLoading,
    issue,
    dismissIssue: useCallback(() => setIssue(null), []),
    punch,
    isPunching: mutation.isPending,
    warning,
  };
}

/** The scale used when there is no roster. Not a claim about anyone's day. */
export const unrosteredScaleMinutes = UNROSTERED_SCALE_MINUTES;

/**
 * This device's waiting punches, read from disk.
 *
 * Under `attendanceKeys.all`, so the flush's one invalidation refreshes it
 * along with the server's day. `networkMode: "always"` because the
 * default pauses queries while offline — which is the only time this one
 * matters.
 */
function usePunchQueue(userId: string | undefined) {
  return useQuery<QueuedPunch[]>({
    queryKey: attendanceKeys.queue(userId ?? ""),
    queryFn: () => queuedPunches(userId ?? ""),
    enabled: Boolean(userId),
    networkMode: "always",
    staleTime: Infinity,
  });
}

/** Carries a pre-flight decision out of the mutation without a 4xx. */
class PreflightStop extends Error {
  constructor(readonly issue: ClockIssue) {
    super("preflight");
  }
}

/**
 * The idempotency key.
 *
 * `crypto.randomUUID` is not available in every React Native runtime, so
 * this is built from time plus randomness. Uniqueness only has to hold
 * within one device's queue, where a millisecond collision plus a
 * matching random suffix is not a realistic concern.
 */
function newPunchId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
