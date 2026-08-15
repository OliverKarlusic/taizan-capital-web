/**
 * The chart ranges, in a module both sides can import.
 *
 * ── WHY THIS IS NOT IN yahoo.ts ─────────────────────────────────────
 * yahoo.ts is server-only: it holds a session cookie and a crumb, and
 * importing it from a client component would pull both into the browser
 * bundle. The range table is pure data with no provider dependency, so
 * it lives here and yahoo.ts imports it too. The range selector needs
 * the keys, the route needs the provider parameters, and neither should
 * be a reason to ship the client a Yahoo session.
 *
 * ── WHY EACH RANGE CARRIES ITS OWN INTERVAL ─────────────────────────
 * The provider will not serve every combination. Minute bars are only
 * retained for recent days, and daily bars over MAX return a payload no
 * chart needs and no phone should download. Each pairing is the finest
 * resolution that actually returns data for that window, verified
 * against the feed rather than assumed:
 *
 *   1D  1m   391 points     5Y  1wk   262 points
 *   5D  5m   391 points     MAX 1mo   168 points, back to 1984
 *
 * `intraday` drives formatting downstream. A 1D readout saying only
 * "14 Aug" is useless when every point shares that date, and a 5Y
 * readout printing a time implies a precision weekly bars do not have.
 */

export const RANGES = {
  "1D": { range: "1d", interval: "1m", intraday: true },
  "5D": { range: "5d", interval: "5m", intraday: true },
  "1M": { range: "1mo", interval: "1d", intraday: false },
  "3M": { range: "3mo", interval: "1d", intraday: false },
  "6M": { range: "6mo", interval: "1d", intraday: false },
  YTD: { range: "ytd", interval: "1d", intraday: false },
  "1Y": { range: "1y", interval: "1d", intraday: false },
  "3Y": { range: "3y", interval: "1d", intraday: false },
  "5Y": { range: "5y", interval: "1wk", intraday: false },
  MAX: { range: "max", interval: "1mo", intraday: false },
} as const;

export type RangeKey = keyof typeof RANGES;
export const RANGE_KEYS = Object.keys(RANGES) as RangeKey[];
export const isRangeKey = (v: string): v is RangeKey => v in RANGES;
