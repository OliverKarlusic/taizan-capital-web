/**
 * The index a listing is measured against.
 *
 * ── WHY THE BENCHMARK IS CHOSEN BY LISTING ──────────────────────────
 * Comparing an ASX bank to the S&P 500 measures the AUD/USD rate and
 * two different economies as much as it measures the bank. The brief is
 * explicit that Australian work is benchmarked to the S&P/ASX 200, and
 * the same logic gives US listings a US index rather than an arbitrary
 * global one.
 *
 * A listing whose exchange is not covered here gets no benchmark at
 * all. That is deliberate: an unmatched index is worse than none,
 * because it looks like a comparison and is not one.
 */

export interface Benchmark {
  symbol: string;
  name: string;
}

const ASX: Benchmark = { symbol: "^AXJO", name: "S&P/ASX 200" };
const US: Benchmark = { symbol: "^GSPC", name: "S&P 500" };

/** Suffix-keyed, because the suffix is what identifies the exchange. */
export function benchmarkFor(symbol: string): Benchmark | null {
  const s = symbol.toUpperCase();
  if (s.endsWith(".AX")) return ASX;
  // An index compared against itself is a flat line at zero.
  if (s.startsWith("^")) return null;
  // Unsuffixed tickers on this feed are US listings. Anything with some
  // other suffix — .HK, .L, .TO — has no index configured here, and gets
  // none rather than a mismatched one.
  if (!s.includes(".")) return US;
  return null;
}

/**
 * Rebase a series to percentage change from its own first observation.
 *
 * ── WHY REBASE RATHER THAN PLOT BOTH LEVELS ─────────────────────────
 * The ASX 200 trades near 8,000 and a bank near 170. On one axis the
 * bank is a flat line along the bottom. Rebasing puts both on the only
 * axis that makes them comparable — change over the window — and it is
 * the comparison a reader is actually making.
 *
 * ── AND WHY THE TWO SERIES ARE NOT ZIPPED ───────────────────────────
 * Two exchanges keep different holidays, so the observation counts and
 * dates differ even over an identical window. Aligning them by index
 * would pair a Tuesday with a Wednesday; interpolating the benchmark
 * onto the security's dates would invent index levels that were never
 * published. Each series keeps its own timestamps and is drawn against
 * a shared time axis, which is the only treatment here that invents
 * nothing.
 */
export function rebase(
  points: { t: number; c: number }[],
): { t: number; v: number }[] {
  if (points.length < 2) return [];
  const base = points[0].c;
  if (!base) return [];
  return points.map((p) => ({ t: p.t, v: ((p.c - base) / base) * 100 }));
}
