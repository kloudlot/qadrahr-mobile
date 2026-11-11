import {
  applyOutcome,
  enqueue,
  forgetUser,
  isDue,
  latestPending,
  punchesFor,
  toRequestBody,
  type QueuedPunch,
} from "./punchQueue";

/**
 * The queue reducer.
 *
 * This is the only code in the app that can silently lose an employee's
 * clock-in, and "it compiles" proves nothing about any of it. Each test
 * below stands for a way someone ends up unpaid or paid for hours they
 * did not work.
 */

const punch = (overrides: Partial<QueuedPunch> = {}): QueuedPunch => ({
  clientPunchId: "c1",
  userId: "u1",
  direction: "in",
  occurredAt: "2026-09-22T08:00:00.000Z",
  latitude: null,
  longitude: null,
  accuracyMetres: null,
  attempts: 0,
  ...overrides,
});

describe("enqueue", () => {
  it("keeps capture order, not arrival order", () => {
    // The server aggregates a day from punch order. A queue that
    // delivers 08:05 before 08:00 produces an out-then-in pair.
    const queue = enqueue(
      enqueue([], punch({ clientPunchId: "late", occurredAt: "2026-09-22T08:05:00.000Z" })),
      punch({ clientPunchId: "early", occurredAt: "2026-09-22T08:00:00.000Z" }),
    );

    expect(queue.map((p) => p.clientPunchId)).toEqual(["early", "late"]);
  });

  it("treats a repeated clientPunchId as the same punch", () => {
    // A double-tap, or a caller that fires twice. Two rows with one id
    // would send the same punch twice and show a queue depth of 2.
    const queue = enqueue(enqueue([], punch()), punch({ direction: "out" }));

    expect(queue).toHaveLength(1);
    expect(queue).toEqual([expect.objectContaining({ direction: "out" })]);
  });
});

describe("applyOutcome", () => {
  it("removes an accepted punch", () => {
    expect(applyOutcome([punch()], "c1", { kind: "accepted" })).toEqual([]);
  });

  it("removes a permanently rejected punch", () => {
    // Keeping it would re-raise the same refusal on every launch, which
    // is worse than silence.
    expect(applyOutcome([punch()], "c1", { kind: "rejected", message: "no" })).toEqual([]);
  });

  it("keeps a retryable punch and counts the attempt", () => {
    const kept = applyOutcome([punch()], "c1", { kind: "retry" });

    expect(kept).toEqual([expect.objectContaining({ clientPunchId: "c1", attempts: 1 })]);
  });

  it("leaves other punches alone", () => {
    const queue = [punch({ clientPunchId: "a" }), punch({ clientPunchId: "b" })];

    expect(applyOutcome(queue, "a", { kind: "accepted" }).map((p) => p.clientPunchId)).toEqual([
      "b",
    ]);
  });
});

describe("punchesFor", () => {
  it("never returns another employee's punch", () => {
    // The buddy-punch this app would otherwise create by itself: an
    // unflushed punch from the previous employee on a shared shift
    // device, sent under the next employee's token and attributed to
    // them.
    const queue = [punch({ clientPunchId: "mine" }), punch({ clientPunchId: "theirs", userId: "u2" })];

    expect(punchesFor(queue, "u1").map((p) => p.clientPunchId)).toEqual(["mine"]);
  });
});

describe("latestPending", () => {
  it("is null when nothing is waiting, so the server's day decides", () => {
    expect(latestPending([], "u1")).toBeNull();
  });

  it("is the most recently captured punch, which is what the button must follow", () => {
    const queue = enqueue(
      [punch({ clientPunchId: "in", direction: "in", occurredAt: "2026-09-22T08:00:00.000Z" })],
      punch({ clientPunchId: "out", direction: "out", occurredAt: "2026-09-22T17:00:00.000Z" }),
    );
    expect(latestPending(queue, "u1")?.direction).toBe("out");
  });

  it("ignores another employee's waiting punch on a shared device", () => {
    const queue = [punch({ userId: "u2", direction: "in" })];
    expect(latestPending(queue, "u1")).toBeNull();
  });
});

describe("forgetUser", () => {
  it("drops only the signing-out employee's punches", () => {
    const queue = [punch({ userId: "u1" }), punch({ clientPunchId: "c2", userId: "u2" })];

    expect(forgetUser(queue, "u1").map((p) => p.userId)).toEqual(["u2"]);
  });
});

describe("isDue", () => {
  const at = Date.parse("2026-09-22T08:00:00.000Z");

  it("sends a fresh punch immediately", () => {
    expect(isDue(punch(), at)).toBe(true);
  });

  it("holds a failed punch back, then releases it", () => {
    const failed = punch({ attempts: 3 }); // 2^3 = 8s

    expect(isDue(failed, at + 7_000)).toBe(false);
    expect(isDue(failed, at + 8_000)).toBe(true);
  });

  it("caps the backoff so a punch is never parked forever", () => {
    // Without the cap, 2^20 seconds is twelve days.
    const stubborn = punch({ attempts: 20 });

    expect(isDue(stubborn, at + 64_000)).toBe(true);
  });
});

describe("toRequestBody", () => {
  it("pins the direction rather than letting the server infer it", () => {
    // The single most important field. Omitting it makes the server
    // infer the opposite of the last punch that day — so a morning
    // clock-in flushed in the evening becomes a clock-out.
    expect(toRequestBody(punch({ direction: "in" })).direction).toBe("in");
  });

  it("carries the capture time, not the send time", () => {
    const body = toRequestBody(punch({ occurredAt: "2026-09-22T08:02:00.000Z" }));

    expect(body.occurredAt).toBe("2026-09-22T08:02:00.000Z");
  });

  it("carries the idempotency key, which is what makes a resend free", () => {
    expect(toRequestBody(punch()).clientPunchId).toBe("c1");
  });

  it("sends location as null rather than omitting it", () => {
    // withinGeofence: null means "no location given" on the server and
    // is explicitly not the same as false. Omitting the keys would be
    // read the same way, but being explicit keeps the two paths
    // identical whether or not a fix was available.
    const body = toRequestBody(punch());

    expect(body).toHaveProperty("latitude", null);
    expect(body).toHaveProperty("accuracyMetres", null);
  });
});
