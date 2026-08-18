import { describe, expect, it } from "vitest";
import { benchmarkFor, rebase } from "./benchmark";

describe("benchmark selection follows the listing", () => {
  it("measures an ASX listing against the S&P/ASX 200", () => {
    expect(benchmarkFor("CBA.AX")?.symbol).toBe("^AXJO");
    expect(benchmarkFor("bhp.ax")?.name).toBe("S&P/ASX 200");
  });

  it("measures a US listing against a US index", () => {
    expect(benchmarkFor("AAPL")?.symbol).toBe("^GSPC");
  });

  it("gives an unconfigured exchange no benchmark rather than a wrong one", () => {
    // A Hong Kong listing against the S&P 500 would measure two
    // economies and a currency, and look like a comparison while not
    // being one.
    expect(benchmarkFor("0700.HK")).toBeNull();
    expect(benchmarkFor("SHEL.L")).toBeNull();
  });

  it("does not benchmark an index against itself", () => {
    expect(benchmarkFor("^AXJO")).toBeNull();
  });
});

describe("rebasing to per-cent change", () => {
  it("starts at zero and tracks change from the first observation", () => {
    const out = rebase([
      { t: 1, c: 100 },
      { t: 2, c: 110 },
      { t: 3, c: 90 },
    ]);
    expect(out[0].v).toBe(0);
    expect(out[1].v).toBeCloseTo(10, 6);
    expect(out[2].v).toBeCloseTo(-10, 6);
  });

  it("preserves each series' own timestamps", () => {
    // The two series are never zipped: different exchanges keep
    // different holidays, so index i of one is not the same date as
    // index i of the other.
    const out = rebase([
      { t: 1755, c: 50 },
      { t: 1899, c: 75 },
    ]);
    expect(out.map((p) => p.t)).toEqual([1755, 1899]);
  });

  it("refuses a series too short to describe a change", () => {
    expect(rebase([{ t: 1, c: 100 }])).toEqual([]);
    expect(rebase([])).toEqual([]);
  });

  it("refuses a zero base rather than dividing by it", () => {
    expect(rebase([{ t: 1, c: 0 }, { t: 2, c: 5 }])).toEqual([]);
  });
});
