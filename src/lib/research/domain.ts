/**
 * Guards for values the provider formats as real but the domain says
 * cannot be.
 *
 * ── A SECOND KIND OF PHANTOM ZERO ───────────────────────────────────
 * The provider marks a stripped field as `{ raw: 0, fmt: null }`, and
 * the accessor in yahoo.ts already rejects that shape. It is a
 * *syntactic* test: the absent formatted value is the tell.
 *
 * It does not catch this:
 *
 *   VAS.AX  annualReportExpenseRatio  { raw: 0, fmt: "0.00%" }
 *   IOZ.AX  annualReportExpenseRatio  { raw: 0, fmt: "0.00%" }
 *
 * Those carry a formatted value, so they read as genuine zeros. They
 * are not. VAS charges 0.07% and IOZ charges 0.09%, both published in
 * the funds' own PDS. Checked against six funds, the ASX-listed ones
 * come back as a formatted zero while the US-listed ones are right, so
 * this is a gap in the provider's non-US fund coverage rather than a
 * parsing error at this end.
 *
 * The distinction worth holding onto: the first guard asks whether the
 * provider said anything, and this one asks whether what it said can be
 * true. No fund operates for free, so a zero expense ratio is not a
 * cheap fund — it is a missing figure wearing a number's clothes, and
 * publishing it would understate the cost of holding an investment.
 * That is the most expensive direction to be wrong in.
 *
 * These are deliberately narrow. A guard that rejects anything
 * surprising would start discarding real data; each one below encodes a
 * fact about the instrument, not a hunch about the number.
 */

/**
 * An expense ratio, or null where the provider's figure cannot be real.
 *
 * Input is a fraction (0.0007 = 0.07%), matching the provider.
 */
export function expenseRatio(v: number | null | undefined): number | null {
  if (v === null || v === undefined || !Number.isFinite(v)) return null;
  // No fund runs at zero cost. Observed on ASX-listed funds specifically.
  if (v <= 0) return null;
  // A ratio over 100% is a unit error somewhere, not a fee.
  if (v > 1) return null;
  return v;
}

/**
 * A price, or null. Zero and negative prices are not quotes.
 *
 * A listed security does not trade at zero; a zero here means the feed
 * had nothing and filled the field rather than omitting it.
 */
export function price(v: number | null | undefined): number | null {
  if (v === null || v === undefined || !Number.isFinite(v)) return null;
  return v > 0 ? v : null;
}

/**
 * Net assets / fund size, or null. A fund with zero assets is a fund
 * that has not launched, and none of those are listed and quoted.
 */
export function netAssets(v: number | null | undefined): number | null {
  if (v === null || v === undefined || !Number.isFinite(v)) return null;
  return v > 0 ? v : null;
}

/**
 * A holdings weight, or null. Weights are fractions of a portfolio, so
 * zero means absent and anything above 1 is not a weight.
 */
export function weight(v: number | null | undefined): number | null {
  if (v === null || v === undefined || !Number.isFinite(v)) return null;
  return v > 0 && v <= 1 ? v : null;
}

/**
 * Fields this terminal will not ingest, whatever the provider offers.
 *
 * ── WHY THIS IS A LIST AND NOT A COMMENT ────────────────────────────
 * The provider returns `financialData.recommendationKey` ("buy"),
 * `targetMeanPrice` (322.28), `recommendationTrend` and the rest. They
 * are free, they are well-populated, and they are exactly what this
 * terminal has undertaken not to publish.
 *
 * Naming them here makes the omission deliberate and greppable. The
 * boundary is at ingestion rather than rendering on purpose: a field
 * that never enters the domain type cannot be added to a table later by
 * someone who did not know the rule.
 */
export const NEVER_INGEST = [
  "recommendationKey",
  "recommendationMean",
  "recommendationTrend",
  "targetMeanPrice",
  "targetHighPrice",
  "targetLowPrice",
  "targetMedianPrice",
  "averageAnalystRating",
  "upgradeDowngradeHistory",
] as const;
