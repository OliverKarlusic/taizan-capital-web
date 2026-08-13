import { describe, expect, it } from "vitest";
import {
  maxDrawdown,
  median,
  periodReturn,
  rangePosition,
  realisedVolatility,
  sectorMedian,
} from "./metrics";

/**
 * The calculation engine, against values that can be checked by hand.
 *
 * Each case here has a known answer derived independently of the
 * implementation, so a test failing means the arithmetic changed rather
 * than that the snapshot drifted.
 */

const series = (closes: number[]) => ({
  timestamps: closes.map((_, i) => i * 86400),
  closes,
});

describe("realisedVolatility", () => {
  it("returns null below the minimum sample", () => {
    // Annualising a fortnight produces an authoritative-looking number
    // that means very little, so it is refused rather than reported.
    expect(realisedVolatility(series(Array(20).fill(100)))).toBeNull();
    expect(realisedVolatility(null)).toBeNull();
  });

  it("is zero for a flat series", () => {
    const v = realisedVolatility(series(Array(60).fill(100)));
    expect(v).not.toBeNull();
    expect(v!).toBeCloseTo(0, 10);
  });

  it("annualises by the square root of 252 trading days", () => {
    // Alternating ±1% daily moves. Daily log returns are ±0.00995033,
    // mean ~0, so sample sd ≈ 0.00995033 and the annualised figure is
    // that times sqrt(252) ≈ 15.79%.
    const closes = [100];
    for (let i = 1; i < 253; i++) {
      closes.push(i % 2 ? closes[i - 1] * 1.01 : closes[i - 1] / 1.01);
    }
    const v = realisedVolatility(series(closes));
    expect(v).not.toBeNull();
    expect(v!).toBeGreaterThan(15);
    expect(v!).toBeLessThan(16.5);
  });
});

describe("maxDrawdown", () => {
  it("measures peak to trough, not first to last", () => {
    // Peak 120, trough 60 → −50%. Recovery afterwards must not erase it.
    expect(maxDrawdown(series([100, 120, 60, 110]))).toBeCloseTo(-50, 6);
  });

  it("is zero for a monotonically rising series", () => {
    expect(maxDrawdown(series([10, 20, 30, 40]))).toBe(0);
  });

  it("returns null without at least two observations", () => {
    expect(maxDrawdown(series([100]))).toBeNull();
    expect(maxDrawdown(null)).toBeNull();
  });
});

describe("periodReturn", () => {
  it("is first to last, price only", () => {
    expect(periodReturn(series([100, 50, 150]))).toBeCloseTo(50, 6);
  });

  it("returns null on a non-positive base", () => {
    expect(periodReturn(series([0, 100]))).toBeNull();
  });
});

describe("rangePosition", () => {
  it("places the price within its range", () => {
    expect(rangePosition(150, 100, 200)).toBeCloseTo(50, 6);
    expect(rangePosition(100, 100, 200)).toBe(0);
    expect(rangePosition(200, 100, 200)).toBe(100);
  });

  it("clamps rather than reporting an impossible position", () => {
    expect(rangePosition(250, 100, 200)).toBe(100);
    expect(rangePosition(50, 100, 200)).toBe(0);
  });

  it("refuses a degenerate or incomplete range", () => {
    expect(rangePosition(150, 200, 100)).toBeNull();
    expect(rangePosition(150, 100, 100)).toBeNull();
    expect(rangePosition(null, 100, 200)).toBeNull();
    expect(rangePosition(150, null, 200)).toBeNull();
  });
});

describe("median", () => {
  it("handles odd and even counts", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("returns null on an empty set", () => {
    expect(median([])).toBeNull();
  });
});

describe("sectorMedian", () => {
  it("excludes nulls rather than treating them as zero", () => {
    // A company with no P/E is not a company with a P/E of zero, and
    // including it would drag every sector median toward nil.
    const r = sectorMedian([10, null, 20, null, 30]);
    expect(r.value).toBe(20);
    expect(r.count).toBe(3);
  });

  it("refuses a median of too few companies", () => {
    // A "median" of two is a midpoint of two; presenting it as peer
    // context would overstate what the comparison establishes.
    const r = sectorMedian([10, 20]);
    expect(r.value).toBeNull();
    expect(r.count).toBe(2);
  });

  it("reports how many companies the median came from", () => {
    expect(sectorMedian([1, 2, 3, 4]).count).toBe(4);
  });
});
