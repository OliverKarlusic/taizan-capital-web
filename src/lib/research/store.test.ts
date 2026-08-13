import { describe, expect, it } from "vitest";
import {
  StoreShape,
  Thesis,
  drift,
  evaluateThesis,
  evaluateTrigger,
  type Trigger,
} from "./store";

const trigger = (over: Partial<Trigger> = {}): Trigger => ({
  id: "t1",
  metric: "price",
  op: "below",
  value: 100,
  ...over,
});

describe("evaluateTrigger", () => {
  it("reports a condition met when the level is crossed", () => {
    expect(evaluateTrigger(trigger(), 90, 120).state).toBe("breached");
    expect(evaluateTrigger(trigger({ op: "above" }), 110, 90).state).toBe(
      "breached",
    );
  });

  it("reports not met while the level holds", () => {
    expect(evaluateTrigger(trigger(), 110, 120).state).toBe("holding");
    expect(evaluateTrigger(trigger({ op: "above" }), 90, 80).state).toBe(
      "holding",
    );
  });

  it("treats the exact level as not met", () => {
    // Strict comparison both ways: "falls below 100" is not satisfied at
    // exactly 100, and the reader who wrote it would not expect it to be.
    expect(evaluateTrigger(trigger(), 100, 120).state).toBe("holding");
    expect(evaluateTrigger(trigger({ op: "above" }), 100, 80).state).toBe(
      "holding",
    );
  });

  it("reports an unavailable figure as unmeasurable, not as holding", () => {
    // The monitoring equivalent of rendering a missing number as zero. A
    // condition nobody can check is not a condition that is intact.
    const r = evaluateTrigger(trigger(), null, 120);
    expect(r.state).toBe("unmeasurable");
    expect(r.current).toBeNull();
    expect(r.atWriting).toBe(120);
  });

  it("rejects a non-finite reading", () => {
    expect(evaluateTrigger(trigger(), Number.NaN, 120).state).toBe(
      "unmeasurable",
    );
  });

  it("carries the value from when the thesis was written", () => {
    expect(evaluateTrigger(trigger(), 90, 120).atWriting).toBe(120);
  });
});

describe("evaluateThesis", () => {
  const base = {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    statement: "…",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("counts each state separately", () => {
    const thesis = Thesis.parse({
      ...base,
      snapshot: { price: 200, trailingPE: 40, returnOnEquity: 1.1 },
      triggers: [
        trigger({ id: "a", metric: "price", op: "below", value: 150 }),
        trigger({ id: "b", metric: "trailingPE", op: "above", value: 60 }),
        trigger({ id: "c", metric: "returnOnEquity", op: "below", value: 0.2 }),
      ],
    });

    const status = evaluateThesis(thesis, {
      price: 120, // met
      trailingPE: 45, // not met
      returnOnEquity: null, // unmeasurable
    });

    expect(status.breached).toBe(1);
    expect(status.holding).toBe(1);
    expect(status.unmeasurable).toBe(1);
    expect(status.results).toHaveLength(3);
  });

  it("treats a metric absent from the reading as unmeasurable", () => {
    const thesis = Thesis.parse({
      ...base,
      snapshot: {},
      triggers: [trigger()],
    });
    expect(evaluateThesis(thesis, {}).unmeasurable).toBe(1);
  });

  it("handles a thesis with no conditions", () => {
    const thesis = Thesis.parse({ ...base, snapshot: {}, triggers: [] });
    const s = evaluateThesis(thesis, { price: 100 });
    expect(s.results).toEqual([]);
    expect(s.breached).toBe(0);
  });
});

describe("drift", () => {
  it("measures change from the snapshot", () => {
    expect(drift(100, 150)).toBeCloseTo(50, 6);
    expect(drift(100, 50)).toBeCloseTo(-50, 6);
  });

  it("uses the absolute base so a negative start does not flip the sign", () => {
    // A margin that was −10% and is now −5% has improved by 50%, not
    // worsened by it.
    expect(drift(-10, -5)).toBeCloseTo(50, 6);
  });

  it("returns null rather than dividing by zero or guessing", () => {
    expect(drift(0, 50)).toBeNull();
    expect(drift(null, 50)).toBeNull();
    expect(drift(100, null)).toBeNull();
  });
});

describe("store schema", () => {
  it("drops a record that no longer matches rather than repairing it", () => {
    const r = Thesis.safeParse({ symbol: "NVDA" }); // no statement/dates
    expect(r.success).toBe(false);
  });

  it("defaults an absent watchlist and theses to empty", () => {
    const r = StoreShape.parse({ version: 1 });
    expect(r.watchlist).toEqual([]);
    expect(r.theses).toEqual([]);
  });

  it("rejects a store from an unknown version", () => {
    expect(StoreShape.safeParse({ version: 2 }).success).toBe(false);
  });
});
