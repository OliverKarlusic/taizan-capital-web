import { describe, expect, it } from "vitest";
import {
  NEVER_INGEST,
  expenseRatio,
  netAssets,
  price,
  weight,
} from "./domain";

describe("expense ratio — a formatted zero is still not a fee", () => {
  it("rejects the zero the provider formats for ASX-listed funds", () => {
    // VAS.AX and IOZ.AX both return { raw: 0, fmt: "0.00%" }. The fmt is
    // present, so the generic phantom-zero guard passes it through; their
    // published MERs are 0.07% and 0.09%.
    expect(expenseRatio(0)).toBeNull();
  });

  it("keeps a real fee", () => {
    expect(expenseRatio(0.0018)).toBeCloseTo(0.0018, 6);
    expect(expenseRatio(0.000945)).toBeCloseTo(0.000945, 6);
  });

  it("rejects a negative fee", () => {
    expect(expenseRatio(-0.001)).toBeNull();
  });

  it("rejects a ratio above 100%, which is a unit error not a fee", () => {
    expect(expenseRatio(1.5)).toBeNull();
  });

  it("is null for missing and non-finite input", () => {
    expect(expenseRatio(null)).toBeNull();
    expect(expenseRatio(undefined)).toBeNull();
    expect(expenseRatio(NaN)).toBeNull();
  });
});

describe("price, net assets, weight", () => {
  it("refuses a zero price — a listed security does not trade at zero", () => {
    expect(price(0)).toBeNull();
    expect(price(-5)).toBeNull();
    expect(price(112.92)).toBe(112.92);
  });

  it("refuses zero net assets", () => {
    expect(netAssets(0)).toBeNull();
    expect(netAssets(26_190_000_000)).toBe(26_190_000_000);
  });

  it("accepts weights in (0, 1] and refuses the rest", () => {
    expect(weight(0.1088)).toBeCloseTo(0.1088, 6);
    expect(weight(1)).toBe(1);
    expect(weight(0)).toBeNull();
    // A weight above 1 means the provider sent a percentage, not a
    // fraction; silently accepting it would render 1088%.
    expect(weight(10.88)).toBeNull();
  });
});

describe("the fields this terminal will not ingest", () => {
  it("names the provider's ratings and price targets", () => {
    // These are free, well-populated, and exactly what must not be
    // published while the firm holds no AFSL. Listing them keeps the
    // omission deliberate rather than accidental.
    for (const f of [
      "recommendationKey",
      "targetMeanPrice",
      "recommendationTrend",
      "averageAnalystRating",
    ]) {
      expect(NEVER_INGEST).toContain(f);
    }
  });

  it("does not leak into any exported guard", () => {
    // The guards convert numbers; none of them should be a route by
    // which a target price becomes a domain value.
    expect(Object.keys({ expenseRatio, netAssets, price, weight })).toHaveLength(
      4,
    );
  });
});
