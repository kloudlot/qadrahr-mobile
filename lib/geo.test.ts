import { checkGeofence, distanceMetres, metresOutside, type Geofence } from "./geo";

/**
 * The geofence port, checked against the server.
 *
 * Every expected value below was produced by running the backend's
 * `src/common/geo/geo.ts` on the same inputs — not by running this file
 * and writing down what it said. That distinction is the whole point of
 * the test: a self-consistent port would pass while still disagreeing
 * with the authority, and the employee would read "340m" while their
 * supervisor reviewed a different number in the exception report.
 *
 * Regenerate with the backend's own module if either side changes.
 */

const OFFICE = { latitude: 6.6018, longitude: 3.3515 };
const FAR = { latitude: 6.4281, longitude: 3.4219 };
const NEAR = { latitude: 6.602, longitude: 3.3517 };
/** Due north of the office, and 211m out — just past a 200m fence. */
const NORTH = { latitude: 6.6037, longitude: 3.3515 };

const fence: Geofence = { ...OFFICE, radiusMeters: 200 };

describe("distanceMetres", () => {
  it("matches the server across a long distance", () => {
    expect(distanceMetres(OFFICE, FAR)).toBeCloseTo(20821.718007269246, 6);
  });

  it("matches the server across a short one", () => {
    expect(distanceMetres(OFFICE, NEAR)).toBeCloseTo(31.346615960096305, 6);
  });

  it("is zero at the same point", () => {
    expect(distanceMetres(OFFICE, OFFICE)).toBe(0);
  });
});

describe("checkGeofence", () => {
  it("agrees with the server outside the fence", () => {
    expect(checkGeofence(FAR, fence)).toEqual({ withinFence: false, distanceMetres: 20822 });
  });

  it("agrees with the server inside it", () => {
    expect(checkGeofence(NEAR, fence)).toEqual({ withinFence: true, distanceMetres: 31 });
  });

  it("widens the fence by the device's own accuracy claim", () => {
    // The case the widening exists for, and the one most likely to be
    // dropped by a reimplementation: 211m from a 200m fence is outside,
    // but a phone reporting 30m of error puts the employee at the door.
    // Being stricter than the server here would warn people whose
    // punches the server would have accepted.
    expect(checkGeofence(NORTH, fence, 30)).toEqual({ withinFence: true, distanceMetres: 211 });
    expect(checkGeofence(NORTH, fence)).toEqual({ withinFence: false, distanceMetres: 211 });
  });

  it("ignores a negative accuracy rather than narrowing the fence", () => {
    expect(checkGeofence(NORTH, fence, -500).withinFence).toBe(false);
  });
});

describe("metresOutside", () => {
  it("is zero inside the fence", () => {
    expect(metresOutside(checkGeofence(NEAR, fence), fence)).toBe(0);
  });

  it("rounds to something a person can act on", () => {
    // Nobody walks 37 metres; they walk "about 40".
    const far = checkGeofence(FAR, fence);
    expect(metresOutside(far, fence) % 10).toBe(0);
  });

  it("reports zero when the excess is too small to walk off", () => {
    // 211m against a 200m fence is 11m out, which rounds to 10 — but a
    // number that will not go down as the employee walks is worse than
    // no number. Anything under 10m reads as arrived.
    const check = { withinFence: false, distanceMetres: 205 };
    expect(metresOutside(check, fence)).toBe(0);
  });
});
