import { useEffect } from "react";
import { AppState } from "react-native";
import { onlineManager, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/components/ui/Toast";

import { formatTime } from "./format";
import { attendanceKeys } from "./queries/attendance";
import { flushQueue, setRejectionListener } from "./punchSync";

/**
 * Keeps the punch queue moving.
 *
 * Four triggers, because there is no single reliable "you are online
 * again" moment on a phone:
 *
 *   1. Connectivity returning, via onlineManager — the obvious one, and
 *      the one the design's "will send itself when signal returns"
 *      promises.
 *   2. The app coming to the foreground. A phone that regained signal
 *      while the app was backgrounded may emit no NetInfo change on
 *      resume, and an employee who reopens the app expects their
 *      morning punch to have gone.
 *   3. Mount, once a user is known — covers a queue that survived a
 *      force-quit.
 *   4. After any successful live punch, which the clock screen calls
 *      directly.
 *
 * Every one of them funnels into the same single-flight flush, so firing
 * together costs one pass rather than four.
 *
 * A queued punch the server refuses outright (a 4xx) leaves the queue for
 * good, so the employee is told once, here — otherwise the clock-in they
 * saw "saved" simply never appears, and they find out on their payslip.
 */
export function usePunchSync(userId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    setRejectionListener(({ direction, occurredAt, message }) => {
      toast.error(
        `Your clock-${direction} at ${formatTime(occurredAt)} wasn't recorded`,
        `${message.replace(/[.\s]+$/, "")}. Ask HR to add it if you need it.`,
      );
    });

    const flush = async () => {
      await flushQueue(userId);
      if (cancelled) return;
      // Whatever landed changed today's totals, the punch list and the
      // week strip. One invalidation covers all three.
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    };

    void flush();

    const unsubscribeOnline = onlineManager.subscribe((online) => {
      if (online) void flush();
    });

    const appStateSubscription = AppState.addEventListener("change", (status) => {
      if (status === "active") void flush();
    });

    return () => {
      cancelled = true;
      setRejectionListener(null);
      unsubscribeOnline();
      appStateSubscription.remove();
    };
  }, [userId, queryClient]);
}
