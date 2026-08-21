/**
 * Compound screening: conditions, groups, and what a missing value does.
 *
 * ── THE RULE EVERYTHING ELSE FOLLOWS FROM ───────────────────────────
 * A null never satisfies a numeric condition. Not under "less than",
 * not under "greater than", and not under a negated one. A company with
 * no price-to-earnings ratio is not a company with a low one — it is a
 * company with no earnings, and letting it pass a "P/E under 15" filter
 * would put it exactly where a reader scanning for cheap companies will
 * land.
 *
 * That has a consequence worth stating rather than discovering: a
 * condition and its opposite do not partition the universe. "P/E under
 * 15" and "P/E of 15 or more" together return fewer companies than
 * exist, and the difference is the ones with no P/E at all. This is the
 * honest behaviour, and the screener says how many rows were excluded
 * for want of data rather than letting the count quietly not add up.
 *
 * ── THREE SCOPES, BECAUSE "CHEAP" IS THREE QUESTIONS ────────────────
 * absolute       P/E under 15 — a fixed number
 * percentile     P/E in the cheapest quartile — relative to the universe
 * sectorRelative P/E below its own sector's median — relative to peers
 *
 * A bank on 12x and a software company on 12x are not comparably
 * valued, and only the third scope can express that. Each is computed
 * from the covered universe at request time; there is no stored table
 * of sector averages anywhere, because a stored one goes stale silently.
 */

export type NumericField =
  | "price"
  | "changePercent"
  | "marketCap"
  | "trailingPE"
  | "priceToBook"
  | "dividendYield";

export type Operator = "lt" | "lte" | "gt" | "gte" | "between";
export type Scope = "absolute" | "percentile" | "sectorRelative";

export interface Condition {
  id: string;
  field: NumericField;
  op: Operator;
  /** For percentile, 0–100. For sectorRelative, a multiple of the median. */
  value: number;
  /** Upper bound for `between`. */
  value2?: number;
  scope: Scope;
}

export interface Group {
  id: string;
  join: "AND" | "OR";
  conditions: Condition[];
}

/** Rows carry at least these; the screener's own row type is wider. */
export interface Screenable {
  symbol: string;
  sector: string | null;
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
  trailingPE: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
}

/**
 * Ratios where a non-positive value is not a smaller value.
 *
 * A price-to-earnings of −8 is not cheaper than 5; it is a company
 * losing money. Treating it as a number on the same line is the same
 * error as treating a null as zero, so these are held out of ratio
 * comparisons exactly as nulls are.
 */
const RATIO_FIELDS = new Set<NumericField>(["trailingPE", "priceToBook"]);

/** The comparable value of a field, or null if it has none. */
export function valueOf(row: Screenable, field: NumericField): number | null {
  const v = row[field];
  if (v === null || !Number.isFinite(v)) return null;
  if (RATIO_FIELDS.has(field) && v <= 0) return null;
  return v;
}

/** Percentile thresholds and sector medians, computed once per evaluation. */
export interface Stats {
  /** Sorted, non-null values per field, for percentile lookups. */
  sorted: Partial<Record<NumericField, number[]>>;
  /** Median per sector per field. */
  sectorMedian: Partial<Record<NumericField, Map<string, number>>>;
}

const median = (sortedAsc: number[]): number | null => {
  if (!sortedAsc.length) return null;
  const mid = Math.floor(sortedAsc.length / 2);
  return sortedAsc.length % 2
    ? sortedAsc[mid]
    : (sortedAsc[mid - 1] + sortedAsc[mid]) / 2;
};

/**
 * Build the reference statistics a relative condition needs.
 *
 * Computed over whatever universe is passed in — which must be the full
 * covered set, not the already-filtered result. Ranking a company
 * against a list that has already been narrowed answers a different
 * question than the reader asked: "cheapest quartile" of a set you
 * filtered to cheap companies is not the cheapest quartile.
 */
export function buildStats(universe: Screenable[]): Stats {
  const fields: NumericField[] = [
    "price",
    "changePercent",
    "marketCap",
    "trailingPE",
    "priceToBook",
    "dividendYield",
  ];
  const sorted: Stats["sorted"] = {};
  const sectorMedian: Stats["sectorMedian"] = {};

  for (const f of fields) {
    const vals: number[] = [];
    const bySector = new Map<string, number[]>();
    for (const r of universe) {
      const v = valueOf(r, f);
      if (v === null) continue;
      vals.push(v);
      if (r.sector) {
        const list = bySector.get(r.sector) ?? [];
        list.push(v);
        bySector.set(r.sector, list);
      }
    }
    vals.sort((a, b) => a - b);
    sorted[f] = vals;

    const meds = new Map<string, number>();
    for (const [sec, list] of bySector) {
      list.sort((a, b) => a - b);
      const m = median(list);
      // A sector of one is its own median, which makes every
      // comparison against it trivially true. Two is the minimum that
      // says anything, so smaller sectors get no median and their
      // conditions return no match rather than a meaningless one.
      if (m !== null && list.length >= 2) meds.set(sec, m);
    }
    sectorMedian[f] = meds;
  }
  return { sorted, sectorMedian };
}

/** The value at a percentile within a sorted ascending array. */
export function percentileValue(
  sortedAsc: number[],
  p: number,
): number | null {
  if (!sortedAsc.length) return null;
  const clamped = Math.max(0, Math.min(100, p));
  const idx = Math.round((clamped / 100) * (sortedAsc.length - 1));
  return sortedAsc[idx];
}

const compare = (v: number, op: Operator, a: number, b?: number): boolean => {
  switch (op) {
    case "lt":
      return v < a;
    case "lte":
      return v <= a;
    case "gt":
      return v > a;
    case "gte":
      return v >= a;
    case "between":
      // Bounds given in either order; a reader typing 30 then 10 means
      // the same range as 10 then 30.
      return b === undefined
        ? false
        : v >= Math.min(a, b) && v <= Math.max(a, b);
  }
};

/**
 * Does one row satisfy one condition?
 *
 * Returns false for a row with no value, at every scope and under every
 * operator. See the note at the top of the file.
 */
export function matches(
  row: Screenable,
  c: Condition,
  stats: Stats,
): boolean {
  const v = valueOf(row, c.field);
  if (v === null) return false;

  if (c.scope === "absolute") return compare(v, c.op, c.value, c.value2);

  if (c.scope === "percentile") {
    const arr = stats.sorted[c.field];
    if (!arr || !arr.length) return false;
    if (c.op === "between") {
      const lo = percentileValue(arr, Math.min(c.value, c.value2 ?? c.value));
      const hi = percentileValue(arr, Math.max(c.value, c.value2 ?? c.value));
      return lo !== null && hi !== null && v >= lo && v <= hi;
    }
    const threshold = percentileValue(arr, c.value);
    return threshold !== null && compare(v, c.op, threshold);
  }

  // sectorRelative: value against a multiple of the sector's median.
  const meds = stats.sectorMedian[c.field];
  if (!meds || !row.sector) return false;
  const m = meds.get(row.sector);
  if (m === undefined) return false;
  if (c.op === "between") {
    const lo = m * Math.min(c.value, c.value2 ?? c.value);
    const hi = m * Math.max(c.value, c.value2 ?? c.value);
    return v >= lo && v <= hi;
  }
  return compare(v, c.op, m * c.value);
}

/**
 * Apply groups to a universe.
 *
 * Conditions inside a group combine by that group's join; groups
 * combine with each other by AND. That is the shape a screen is
 * normally written in — "large cap AND (cheap OR high-yielding)" — and
 * it avoids an arbitrary-depth expression tree the interface would then
 * have to let people build and read.
 *
 * An empty group matches everything rather than nothing: a half-built
 * screen should show the universe, not an empty table that looks like a
 * failure.
 */
export function applyGroups(
  universe: Screenable[],
  groups: Group[],
  stats: Stats,
): Screenable[] {
  const active = groups.filter((g) => g.conditions.length > 0);
  if (!active.length) return universe;

  return universe.filter((row) =>
    active.every((g) =>
      g.join === "AND"
        ? g.conditions.every((c) => matches(row, c, stats))
        : g.conditions.some((c) => matches(row, c, stats)),
    ),
  );
}

/**
 * How many rows a set of conditions could not judge for want of data.
 *
 * Reported on screen so a count that seems short has a stated reason.
 * Without it the reader is left to assume the filter was stricter than
 * it was, or that rows went missing.
 */
export function excludedForMissingData(
  universe: Screenable[],
  groups: Group[],
): number {
  const fields = new Set<NumericField>();
  for (const g of groups) for (const c of g.conditions) fields.add(c.field);
  if (!fields.size) return 0;
  return universe.filter((r) =>
    [...fields].some((f) => valueOf(r, f) === null),
  ).length;
}
