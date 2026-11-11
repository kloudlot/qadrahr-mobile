/**
 * Geofence arithmetic, for the sentence the employee reads.
 *
 * A deliberate port of the server's `common/geo/geo.ts` — same earth
 * radius, same haversine, same rounding, same accuracy-widening. Not for
 * tidiness: screen 03 says "340m outside the Ikeja HQ geofence", and
 * that number has to be the number the server records, or the employee
 * reads one figure and their supervisor reviews another in the exception
 * report.
 *
 * This decides NOTHING. The server recomputes the distance itself and is
 * the only authority on whether a punch is in or out of fence; an
 * out-of-fence punch is recorded and flagged, never refused. What this
 * buys is the ability to tell someone how far they have to walk BEFORE
 * they tap, instead of after.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Geofence extends Coordinates {
  radiusMeters: number;
}

const EARTH_RADIUS_METRES = 6_371_008.8;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Great-circle distance in metres.
 *
 * Haversine, on a spherical earth. Accurate to roughly 0.5% — metres
 * over a workplace-sized fence, far below GPS error and therefore not
 * the limiting factor.
 */
export function distanceMetres(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.min(1, Math.sqrt(a)));
}

export interface GeofenceCheck {
  withinFence: boolean;
  distanceMetres: number;
}

/**
 * Whether a position falls inside a fence.
 *
 * `accuracyMetres` widens the fence by the device's own reported error,
 * exactly as the server does. Without it, someone standing at the office
 * door with a 30-metre fix is told they are 12 metres out — a complaint
 * caused by their phone rather than by where they are standing.
 *
 * The client matching the server's generosity matters more than the
 * generosity itself: a pre-flight that is stricter than the server would
 * warn people whose punches would have been accepted anyway.
 */
export function checkGeofence(
  position: Coordinates,
  fence: Geofence,
  accuracyMetres = 0,
): GeofenceCheck {
  const distance = distanceMetres(position, fence);
  const tolerance = fence.radiusMeters + Math.max(0, accuracyMetres);

  return { withinFence: distance <= tolerance, distanceMetres: Math.round(distance) };
}

/**
 * How far outside the fence, for display. Zero when inside.
 *
 * Rounded to something a person can act on — nobody walks 37 metres,
 * they walk "about 40". Below 10m the fence is effectively reached and
 * the honest answer is 0 rather than a number that will not go down.
 */
export function metresOutside(check: GeofenceCheck, fence: Geofence): number {
  if (check.withinFence) return 0;
  const excess = check.distanceMetres - fence.radiusMeters;
  return excess < 10 ? 0 : Math.round(excess / 10) * 10;
}
