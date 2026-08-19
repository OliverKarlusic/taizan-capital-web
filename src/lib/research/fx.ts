/**
 * Currency conversion, and the figures it must not be applied to.
 *
 * ── WHAT THIS IS FOR ────────────────────────────────────────────────
 * A reader in Australia looking at a US listing sees prices and a
 * market capitalisation in USD. Converting those to AUD answers the
 * question they actually have — how big is this, in money I think in.
 *
 * ── AND WHERE IT WOULD BE A LIE ─────────────────────────────────────
 * Today's rate belongs to today's figures. Applying it to a revenue
 * line reported three years ago produces a number that was never true
 * in any currency: the company did not earn that, and no rate in
 * history would have made it so. Converting a historical statement
 * needs the rate at each reporting date, which this free tier does not
 * provide per-period.
 *
 * So conversion is offered for live quote figures — price, market
 * capitalisation, fifty-two week range — and refused for statements.
 * `convertible()` encodes that boundary rather than leaving it to each
 * call site to remember, because the failure is silent: a converted
 * historical figure looks exactly like a correct one.
 *
 * ── AND THE RATE ITSELF CARRIES ITS TIME ────────────────────────────
 * Every converted figure is only as current as the rate behind it, so
 * the rate's own timestamp travels with it and is shown. A conversion
 * stamped with the moment it was computed, rather than the moment the
 * rate was quoted, would overstate its freshness.
 */

export interface FxRate {
  from: string;
  to: string;
  rate: number;
  /** When the provider last quoted this rate, ISO. */
  quotedAt: string;
}

/**
 * Figures a live rate may be applied to.
 *
 * Deliberately a allow-list rather than a deny-list: a field added
 * later is not convertible until someone decides it is, which fails
 * toward showing the native currency rather than toward a wrong number.
 */
const CONVERTIBLE = new Set([
  "price",
  "previousClose",
  "marketCap",
  "fiftyTwoWeekLow",
  "fiftyTwoWeekHigh",
  "navPrice",
  "netAssets",
]);

export const convertible = (field: string): boolean => CONVERTIBLE.has(field);

/**
 * Apply a rate, or return null if either input is missing.
 *
 * Never coerces: a null figure stays null rather than becoming zero in
 * the target currency.
 */
export function convert(
  value: number | null,
  rate: FxRate | null,
): number | null {
  if (value === null || !rate || !Number.isFinite(rate.rate)) return null;
  return value * rate.rate;
}

/**
 * Yahoo's FX pair symbol for a conversion.
 *
 * The feed quotes both directions as separate instruments — AUDUSD=X
 * and USDAUD=X — so the correct pair is fetched rather than inverting
 * one of them. Inverting introduces a rounding difference against what
 * the provider itself publishes, and two places on the same page
 * disagreeing by a cent invites the reader to distrust both.
 */
export function pairSymbol(from: string, to: string): string | null {
  const f = from?.toUpperCase();
  const t = to?.toUpperCase();
  if (!f || !t || f.length !== 3 || t.length !== 3) return null;
  if (f === t) return null;
  return `${f}${t}=X`;
}

/** A short label naming the basis, for display beside a converted figure. */
export function conversionNote(rate: FxRate): string {
  return `Converted from ${rate.from} at ${rate.rate.toFixed(4)}, quoted ${
    rate.quotedAt.slice(0, 16).replace("T", " ")
  }Z`;
}
