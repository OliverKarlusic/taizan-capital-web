/**
 * Derived risk measures and peer context.
 *
 * ── EVERYTHING HERE IS ARITHMETIC ON REAL SERIES ────────────────────
 * Nothing in this file estimates, models or fills a gap. Each function
 * takes observed closes or observed ratios and returns a computation over
 * them, or null when there is not enough data to compute one honestly.
 *
 * ── AND NOTHING HERE IS A JUDGEMENT ─────────────────────────────────
 * These are measurements, not assessments. No function returns a score, a
 * band, a grade or a verdict, and none should be added. "Volatility is
 * 24.1%" is a fact; "volatility is high" is an opinion the firm is not
 * licensed to offer.
 */

import type { History } from "./yahoo";

const TRADING_DAYS = 252;

/**
 * Annualised realised volatility from daily log returns.
 *
 * Log returns rather than simple returns because they are additive across
 * time, which is what makes the √252 scaling valid. Requires at least 30
 * observations — annualising a fortnight of data produces a number that
 * looks authoritative and means very little.
 */
export function realisedVolatility(history: History | null): number | null {
  if (!history || history.closes.length < 31) return null;

  const returns: number[] = [];
  for (let i = 1; i < history.closes.length; i++) {
    const prev = history.closes[i - 1];
    const curr = history.closes[i];
    if (prev > 0 && curr > 0) returns.push(Math.log(curr / prev));
  }
  if (returns.length < 30) return null;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  // Sample variance (n−1): these returns are a sample of the process, not
  // the whole of it.
  const variance =
    returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(TRADING_DAYS) * 100;
}

/**
 * Deepest peak-to-trough fall in the observed window, as a percentage.
 *
 * Computed on closing prices only, so it is the worst close-to-close
 * decline and not the worst intraday one. The true drawdown was at least
 * this large and may have been larger.
 */
export function maxDrawdown(history: History | null): number | null {
  if (!history || history.closes.length < 2) return null;
  let peak = history.closes[0];
  let worst = 0;
  for (const c of history.closes) {
    if (c > peak) peak = c;
    if (peak > 0) worst = Math.min(worst, (c - peak) / peak);
  }
  return worst * 100;
}

/** Total return across the observed window, price only — excludes dividends. */
export function periodReturn(history: History | null): number | null {
  if (!history || history.closes.length < 2) return null;
  const first = history.closes[0];
  const last = history.closes[history.closes.length - 1];
  if (first <= 0) return null;
  return ((last - first) / first) * 100;
}

/** Where the current price sits in its 52-week range, 0–100. */
export function rangePosition(
  price: number | null,
  low: number | null,
  high: number | null,
): number | null {
  if (price === null || low === null || high === null) return null;
  if (high <= low) return null;
  return Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
}

export const median = (xs: number[]): number | null => {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
};

export interface PeerContext {
  /** Median across covered companies in the same sector. */
  value: number | null;
  /** How many companies that median is drawn from. */
  count: number;
}

/**
 * The sector median, computed from this terminal's own coverage.
 *
 * ── A DELIBERATE LIMITATION, STATED ON SCREEN ───────────────────────
 * This is NOT "the sector average". It is the median of the companies
 * this screener happens to cover in that sector — a few dozen large
 * listed names, not the sector. Calling it a sector average would imply a
 * completeness the universe does not have.
 *
 * Returns null below three companies. A "median" of two is a midpoint of
 * two, and presenting it as peer context would be misleading.
 */
export function sectorMedian(
  values: (number | null)[],
  minimum = 3,
): PeerContext {
  const usable = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (usable.length < minimum) return { value: null, count: usable.length };
  return { value: median(usable), count: usable.length };
}
