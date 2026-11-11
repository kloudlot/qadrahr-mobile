import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";

import type { Coordinates } from "./geo";

/**
 * A single foreground position fix, for the moment of a clock-in.
 *
 * Deliberately NOT the background task in velo-mobile's
 * `riderLocation.ts`. Nothing here tracks anyone: a punch needs one fix
 * at the instant of the tap, and a workforce app that watched employees'
 * locations between clock-ins would be a different product with
 * different consent.
 *
 * The shape differs from velo's `useRiderPosition` in one way that
 * matters. That one returns `null` for every failure; this one names
 * them, because screen 03 has a different sentence for each — "turn on
 * Location" and "allow QadraHR to use your location" send the employee
 * to different places, and a wrong instruction is worse than none.
 */

export type PositionStatus =
  | "locating"
  /** A usable fix. */
  | "ready"
  /** The OS location service is off, for every app. */
  | "disabled"
  /** This app was refused. */
  | "denied"
  /** Permitted, but no fix came back. */
  | "unavailable";

export interface PositionState {
  status: PositionStatus;
  coordinates: Coordinates | null;
  /** The device's own error estimate. The fence is widened by it. */
  accuracyMetres: number | null;
  /** When the fix was taken — screen 02 shows "confirmed 4s ago". */
  acquiredAt: number | null;
  refresh: () => void;
}

/** Long enough for a cold GPS fix, short enough not to strand the button. */
const TIMEOUT_MS = 10_000;

export function useCurrentPosition(): PositionState {
  const [state, setState] = useState<Omit<PositionState, "refresh">>({
    status: "locating",
    coordinates: null,
    accuracyMetres: null,
    acquiredAt: null,
  });

  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    const settle = (next: Omit<PositionState, "refresh">) => {
      if (!cancelled) setState(next);
    };

    const fail = (status: Exclude<PositionStatus, "ready">) =>
      settle({ status, coordinates: null, accuracyMetres: null, acquiredAt: null });

    void (async () => {
      settle({
        status: "locating",
        coordinates: null,
        accuracyMetres: null,
        acquiredAt: null,
      });

      // Checked before the permission, because the two are genuinely
      // different problems: services off is a device setting that affects
      // every app, and asking for permission while they are off produces
      // a grant that still yields no fix.
      if (!(await Location.hasServicesEnabledAsync())) return fail("disabled");

      const existing = await Location.getForegroundPermissionsAsync();
      const granted =
        existing.granted || (await Location.requestForegroundPermissionsAsync()).granted;

      if (!granted) return fail("denied");

      try {
        // Raced rather than trusted: on a cold start indoors this can
        // hang well past any useful wait, and an employee staring at a
        // disabled Clock in button has no idea why.
        const fix = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
        ]);

        if (!fix) return fail("unavailable");

        settle({
          status: "ready",
          coordinates: { latitude: fix.coords.latitude, longitude: fix.coords.longitude },
          accuracyMetres: fix.coords.accuracy ?? null,
          acquiredAt: Date.now(),
        });
      } catch {
        fail("unavailable");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return { ...state, refresh };
}
