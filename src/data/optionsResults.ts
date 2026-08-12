/**
 * Options — realised trades.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────
 * Every figure below was supplied directly and is recorded verbatim.
 * Nothing is derived except the two gross returns, which are computed
 * from the entry and exit premiums in this file rather than transcribed,
 * so the displayed percentage cannot drift from the prices it claims to
 * come from.
 *
 * Both stated returns reconcile exactly:
 *   UNH  (33.00 - 9.05) / 9.05 = 264.64%
 *   PFE  (1.99 - 1.14) / 1.14  =  74.56%
 *
 * ── WHAT IS DELIBERATELY NOT HERE ───────────────────────────────────
 * No combined percentage return. Capital was deployed in USD and the
 * realised profit is recorded in AUD; a blended percentage across the two
 * would need an FX rate and a date for each leg, and neither exists. The
 * combined figures shown are the two things that can be added honestly —
 * AUD profit to AUD profit, USD capital to USD capital.
 *
 * No fee deduction. The source mentions further premiums of roughly
 * 0.34-0.54 whose meaning is unclear. They are not subtracted from any
 * return and not described as brokerage, commission, exchange or contract
 * fees, because the source does not say that is what they are.
 *
 * No expiry year for the UNH contract. The source gives "19 September"
 * without one. It is displayed as supplied rather than completed by
 * inference.
 */

export interface OptionTrade {
  underlying: string;
  /** Contract as written, e.g. "US$320 Call". */
  contract: string;
  /** Exactly as supplied. May lack a year — see note above. */
  expiry: string;
  /** Premium paid, USD per share. */
  entry: number;
  /** Premium received, USD per share. */
  exit: number;
  /** Capital deployed, USD. */
  capital: number;
  /** Realised profit, AUD. */
  realisedAud: number;
  /** Option delta at the recorded point. */
  delta: number;
  /** True where the delta is a rounded estimate rather than a measurement. */
  deltaApproximate: boolean;
}

export const TRADES: OptionTrade[] = [
  {
    underlying: "UNH",
    contract: "US$320 Call",
    expiry: "19 September",
    entry: 9.05,
    exit: 33.0,
    capital: 905,
    realisedAud: 3370.23,
    delta: 0.61,
    deltaApproximate: true,
  },
  {
    underlying: "PFE",
    contract: "US$26 Call",
    expiry: "15 January 2027",
    entry: 1.14,
    exit: 1.99,
    capital: 114,
    realisedAud: 119,
    delta: 0.6137,
    deltaApproximate: false,
  },
];

/** Computed from the premiums above, never transcribed. */
export const grossReturn = (t: OptionTrade) => (t.exit - t.entry) / t.entry;

export const TOTAL_REALISED_AUD = TRADES.reduce(
  (a, t) => a + t.realisedAud,
  0,
);
export const TOTAL_CAPITAL_USD = TRADES.reduce((a, t) => a + t.capital, 0);

/**
 * Amounts in the source of roughly 0.34-0.54 with no stated meaning.
 * Recorded so the omission is visible rather than silent, and excluded
 * from every calculation.
 */
export const UNCATEGORISED_COSTS_NOTE =
  "The source records further premiums of approximately 0.34 to 0.54 whose purpose is not stated. They are excluded from the returns above and are not described as fees, because the source does not say what they are.";
