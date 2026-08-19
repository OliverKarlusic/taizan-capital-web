import { describe, expect, it, vi } from "vitest";
import { Budgeter } from "./budget";

/** A controllable clock, so no test waits on a real window. */
function harness(limit: number, windowMs: number) {
  let t = 0;
  const sleeps: number[] = [];
  const b = new Budgeter(
    { p: { limit, windowMs } },
    () => t,
    async (ms) => {
      sleeps.push(ms);
      t += ms; // sleeping advances the clock, as it would in reality
    },
  );
  return { b, sleeps, advance: (ms: number) => (t += ms), now: () => t };
}

describe("in-flight deduplication", () => {
  it("shares one call between identical concurrent requests", async () => {
    const { b } = harness(100, 1000);
    const load = vi.fn(
      () => new Promise<string>((r) => setTimeout(() => r("x"), 10)),
    );

    const [a, c] = await Promise.all([
      b.run("p", "same", load),
      b.run("p", "same", load),
    ]);

    expect(load).toHaveBeenCalledTimes(1);
    expect(a).toBe("x");
    expect(c).toBe("x");
  });

  it("does not share between different keys", async () => {
    const { b } = harness(100, 1000);
    const load = vi.fn(async () => "x");
    await Promise.all([b.run("p", "a", load), b.run("p", "b", load)]);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("releases the key once settled, so a later call re-fetches", async () => {
    const { b } = harness(100, 1000);
    const load = vi.fn(async () => "x");
    await b.run("p", "k", load);
    await b.run("p", "k", load);
    expect(load).toHaveBeenCalledTimes(2);
    expect(b.inFlightCount).toBe(0);
  });

  it("releases the key when the request throws", async () => {
    const { b } = harness(100, 1000);
    await expect(
      b.run("p", "k", async () => {
        throw new Error("upstream");
      }),
    ).rejects.toThrow("upstream");
    // A failed request must not wedge the key and block every retry.
    expect(b.inFlightCount).toBe(0);
    await expect(b.run("p", "k", async () => "ok")).resolves.toBe("ok");
  });
});

describe("budget enforcement", () => {
  it("counts each call against the window", async () => {
    const { b } = harness(3, 1000);
    for (let i = 0; i < 3; i++) await b.run("p", `k${i}`, async () => i);
    const s = b.state("p");
    expect(s.used).toBe(3);
    expect(s.limit).toBe(3);
  });

  it("queues past the limit rather than dropping the request", async () => {
    // Dropping would surface as a dash, which the reader cannot tell
    // apart from data the source genuinely does not have.
    const { b, sleeps } = harness(2, 1000);
    await b.run("p", "a", async () => 1);
    await b.run("p", "b", async () => 2);
    const third = await b.run("p", "c", async () => 3);
    expect(third).toBe(3);
    expect(sleeps.length).toBeGreaterThan(0);
  });

  it("resets the count when the window rolls", async () => {
    const { b, advance } = harness(2, 1000);
    await b.run("p", "a", async () => 1);
    await b.run("p", "b", async () => 2);
    expect(b.state("p").used).toBe(2);
    advance(1001);
    expect(b.state("p").used).toBe(0);
  });

  it("reports how long until the window rolls", async () => {
    const { b, advance } = harness(5, 1000);
    await b.run("p", "a", async () => 1);
    advance(400);
    expect(b.state("p").resetsInMs).toBe(600);
  });

  it("passes through unbudgeted providers untouched", async () => {
    const { b } = harness(1, 1000);
    const load = vi.fn(async () => "x");
    for (let i = 0; i < 5; i++) await b.run("other", `k${i}`, load);
    expect(load).toHaveBeenCalledTimes(5);
    expect(b.state("other").limit).toBe(Infinity);
  });
});
