import { describe, expect, it } from "vitest";
import {
  applyGroups,
  buildStats,
  excludedForMissingData,
  matches,
  percentileValue,
  valueOf,
  type Condition,
  type Group,
  type Screenable,
} from "./filters";

const row = (o: Partial<Screenable> & { symbol: string }): Screenable => ({
  sector: "Financials",
  price: 100,
  changePercent: 1,
  marketCap: 1e9,
  trailingPE: 15,
  priceToBook: 2,
  dividendYield: 3,
  ...o,
});

const cond = (o: Partial<Condition>): Condition => ({
  id: "c1",
  field: "trailingPE",
  op: "lt",
  value: 20,
  scope: "absolute",
  ...o,
});

const universe: Screenable[] = [
  row({ symbol: "A", trailingPE: 5, sector: "Financials" }),
  row({ symbol: "B", trailingPE: 10, sector: "Financials" }),
  row({ symbol: "C", trailingPE: 20, sector: "Financials" }),
  row({ symbol: "D", trailingPE: 40, sector: "Technology" }),
  row({ symbol: "E", trailingPE: 60, sector: "Technology" }),
  row({ symbol: "F", trailingPE: null, sector: "Technology" }),
  row({ symbol: "G", trailingPE: -8, sector: "Energy" }),
];
const stats = buildStats(universe);

describe("a missing value never satisfies a condition", () => {
  it("fails under less-than", () => {
    expect(matches(row({ symbol: "X", trailingPE: null }), cond({ op: "lt", value: 100 }), stats)).toBe(false);
  });

  it("fails under greater-than too", () => {
    // Both directions, so a reader cannot find the row by inverting.
    expect(matches(row({ symbol: "X", trailingPE: null }), cond({ op: "gt", value: -1 }), stats)).toBe(false);
  });

  it("means a condition and its opposite do not partition the universe", () => {
    // Stated as a test because it is surprising and correct: the gap is
    // exactly the rows with no value, which the screener reports rather
    // than letting the arithmetic quietly not add up.
    const under = applyGroups(universe, [
      { id: "g", join: "AND", conditions: [cond({ op: "lt", value: 20 })] },
    ], stats).length;
    const over = applyGroups(universe, [
      { id: "g", join: "AND", conditions: [cond({ op: "gte", value: 20 })] },
    ], stats).length;
    expect(under + over).toBeLessThan(universe.length);
    expect(excludedForMissingData(universe, [
      { id: "g", join: "AND", conditions: [cond({})] },
    ])).toBe(2); // F has null, G has a negative ratio
  });
});

describe("a non-positive ratio is not a small ratio", () => {
  it("is treated as having no value", () => {
    // -8 is not cheaper than 5; it is a company losing money.
    expect(valueOf(row({ symbol: "G", trailingPE: -8 }), "trailingPE")).toBeNull();
    expect(matches(row({ symbol: "G", trailingPE: -8 }), cond({ op: "lt", value: 10 }), stats)).toBe(false);
  });

  it("does not apply to fields where negative is meaningful", () => {
    // A price falling 4% is a real observation, not a missing one.
    expect(valueOf(row({ symbol: "X", changePercent: -4 }), "changePercent")).toBe(-4);
  });
});

describe("percentile scope", () => {
  it("picks the value at a rank within the universe", () => {
    expect(percentileValue([5, 10, 20, 40, 60], 0)).toBe(5);
    expect(percentileValue([5, 10, 20, 40, 60], 100)).toBe(60);
    expect(percentileValue([5, 10, 20, 40, 60], 50)).toBe(20);
  });

  it("selects the cheapest quartile by rank, not by absolute value", () => {
    const out = applyGroups(universe, [{
      id: "g", join: "AND",
      conditions: [cond({ scope: "percentile", op: "lte", value: 25 })],
    }], stats).map((r) => r.symbol);
    // Non-null P/Es are 5,10,20,40,60. The 25th percentile is 10.
    expect(out).toEqual(["A", "B"]);
  });

  it("is empty when nothing in the universe has the field", () => {
    const blank = [row({ symbol: "Z", trailingPE: null })];
    const s = buildStats(blank);
    expect(matches(blank[0], cond({ scope: "percentile", value: 50 }), s)).toBe(false);
  });
});

describe("sector-relative scope", () => {
  it("compares a company to its own sector's median", () => {
    // Financials P/Es are 5,10,20 -> median 10, so A alone is below it.
    // Technology holds 40 and 60 -> median 50, so D is below its own.
    // Both belong in the result: each is cheap relative to its peers,
    // which is the question this scope asks and an absolute filter
    // cannot express.
    const out = applyGroups(universe, [{
      id: "g", join: "AND",
      conditions: [cond({ scope: "sectorRelative", op: "lt", value: 1 })],
    }], stats).map((r) => r.symbol);
    expect(out).toEqual(["A", "D"]);
  });

  it("distinguishes a bank on 12x from software on 12x", () => {
    // The whole reason this scope exists. Technology's median is 50, so
    // a technology name at 40 is below its sector while a financial at
    // 20 is above its own.
    const tech = row({ symbol: "D", trailingPE: 40, sector: "Technology" });
    const fin = row({ symbol: "C", trailingPE: 20, sector: "Financials" });
    const below = cond({ scope: "sectorRelative", op: "lt", value: 1 });
    expect(matches(tech, below, stats)).toBe(true);
    expect(matches(fin, below, stats)).toBe(false);
  });

  it("refuses a sector too small to have a meaningful median", () => {
    // Energy holds one company, whose median is itself — every
    // comparison against it would be trivially true or false.
    const energy = row({ symbol: "G", trailingPE: 30, sector: "Energy" });
    const s = buildStats([...universe, energy]);
    expect(matches(energy, cond({ scope: "sectorRelative", op: "lt", value: 2 }), s)).toBe(false);
  });

  it("refuses a row with no sector", () => {
    expect(matches(row({ symbol: "X", sector: null }), cond({ scope: "sectorRelative", value: 1 }), stats)).toBe(false);
  });
});

describe("groups", () => {
  const large = cond({ id: "a", field: "marketCap", op: "gte", value: 1e9 });
  const cheap = cond({ id: "b", field: "trailingPE", op: "lt", value: 12 });
  const yielding = cond({ id: "c", field: "dividendYield", op: "gte", value: 2 });

  it("combines conditions inside a group by its join", () => {
    const or: Group = { id: "g", join: "OR", conditions: [cheap, yielding] };
    // Every row yields 3%, so OR matches everything with a value.
    expect(applyGroups(universe, [or], stats).length).toBe(universe.length);

    const and: Group = { id: "g", join: "AND", conditions: [cheap, yielding] };
    expect(applyGroups(universe, [and], stats).map((r) => r.symbol)).toEqual(["A", "B"]);
  });

  it("combines groups with each other by AND", () => {
    // "large cap AND (cheap OR high-yielding)" — the shape a screen is
    // normally written in.
    const out = applyGroups(universe, [
      { id: "g1", join: "AND", conditions: [large] },
      { id: "g2", join: "OR", conditions: [cheap, yielding] },
    ], stats);
    expect(out.length).toBe(universe.length);
  });

  it("treats an empty screen as the whole universe, not an empty result", () => {
    // A half-built screen should show everything, not a blank table
    // that looks like a failure.
    expect(applyGroups(universe, [], stats).length).toBe(universe.length);
    expect(applyGroups(universe, [{ id: "g", join: "AND", conditions: [] }], stats).length)
      .toBe(universe.length);
  });

  it("handles between with bounds given in either order", () => {
    const a = applyGroups(universe, [{ id: "g", join: "AND", conditions: [cond({ op: "between", value: 10, value2: 40 })] }], stats);
    const b = applyGroups(universe, [{ id: "g", join: "AND", conditions: [cond({ op: "between", value: 40, value2: 10 })] }], stats);
    expect(a.map((r) => r.symbol)).toEqual(b.map((r) => r.symbol));
    expect(a.map((r) => r.symbol)).toEqual(["B", "C", "D"]);
  });
});

describe("statistics are built from the universe, not the result", () => {
  it("ranks against everything covered", () => {
    // Ranking against an already-filtered list answers a different
    // question: the "cheapest quartile" of a set you filtered to cheap
    // companies is not the cheapest quartile.
    const narrowed = universe.filter((r) => (r.trailingPE ?? 0) > 30);
    const fromUniverse = buildStats(universe).sorted.trailingPE;
    const fromNarrowed = buildStats(narrowed).sorted.trailingPE;
    expect(fromUniverse).not.toEqual(fromNarrowed);
    expect(percentileValue(fromUniverse!, 25)).toBe(10);
    expect(percentileValue(fromNarrowed!, 25)).toBe(40);
  });
});
