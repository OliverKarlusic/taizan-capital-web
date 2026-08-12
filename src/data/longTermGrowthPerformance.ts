/**
 * Long Term Growth — performance.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────
 * Four CommSec financial-year statements, 1 Feb 2023 to 30 Jun 2026,
 * transcribed and reconciled in public/media/results/. Portfolio values
 * at the four year-ends are statement figures. The 1 Feb 2023 opening is
 * the first contract note. The benchmark is a counterfactual: the same
 * cash flows on the same dates into IVV.AX, the ASX-listed S&P 500
 * tracker, with distributions reinvested.
 *
 * ── FIVE POINTS, AND ONLY FIVE ──────────────────────────────────────
 * There are no intra-year marks. A monthly series exists in the source
 * and is marked "do not publish" — 33 of its 41 month-ends are
 * interpolated between observed prices, so it cannot show any fall that
 * happened and recovered between two observations. It is smoother than
 * the portfolio actually was. Nothing here interpolates, and the chart
 * uses a categorical axis because the gaps between marks are unequal in
 * time; spacing them evenly and drawing a curve would invent a path that
 * was never measured.
 */

export const INCEPTION = "1 February 2023";
export const AS_AT = "30 June 2026";

export interface Point {
  label: string;
  portfolio: number;
  benchmark: number;
  capital: number;
}

/** AUD. Straight segments between these and nothing between them. */
export const SERIES: Point[] = [
  { label: "Feb 23", portfolio: 1120, benchmark: 1120, capital: 1120 },
  { label: "Jun 23", portfolio: 1109.0, benchmark: 1194.0, capital: 1082.5 },
  { label: "Jun 24", portfolio: 3855.27, benchmark: 4273.0, capital: 3501.41 },
  { label: "Jun 25", portfolio: 22854.27, benchmark: 23954.0, capital: 20929.0 },
  { label: "Jun 26", portfolio: 35512.35, benchmark: 38132.04, capital: 30558.92 },
];

export const ANNUAL = [
  { period: "FY23 (5 months)", portfolio: 2.43, benchmark: 10.12 },
  { period: "FY24", portfolio: 13.75, benchmark: 26.48 },
  { period: "FY25", portfolio: 11.46, benchmark: 15.27 },
  { period: "FY26", portfolio: 11.51, benchmark: 15.61 },
];

export const STATS = [
  { label: "XIRR", portfolio: "11.63%", benchmark: "17.36%", note: "per annum, money-weighted" },
  { label: "Annualised TWR", portfolio: "11.48%", benchmark: "19.90%", note: "time-weighted" },
  { label: "Cumulative", portfolio: "44.8%", benchmark: "85.6%", note: "since inception" },
];

export const TERMINAL = {
  portfolio: 35512.35,
  benchmark: 38132.04,
  gap: -2619.69,
  gapPct: -6.9,
};

export const CAPITAL = {
  net: 30558.92,
  gain: 4953.43,
  brokerage: 509.25,
  dividends: 1188.38,
  franking: 357.7,
  xirrInclFranking: "12.52%",
};

/**
 * The cumulative figure is method-sensitive and is shown to one decimal
 * for that reason. Chain-linking annually gives 44.82%; chain-linking
 * monthly gives 40.37%. Neither is wrong — Modified Dietz across a full
 * year containing large mid-year contributions is a coarse approximation.
 * The 4.4-point spread is the honest measure of what is still unresolved,
 * and quoting two decimals would claim a precision the data has not
 * earned.
 */
export const METHOD_NOTES = [
  "Returns are time-weighted using chain-linked Modified Dietz; XIRR is money-weighted. Both are shown because they answer different questions — one measures the strategy, the other measures what the timing of contributions actually produced.",
  "Cumulative return is 44.82% chain-linked annually and 40.37% chain-linked monthly. The figure is shown to one decimal place because a 4.4-point spread does not support two.",
  "The benchmark is a counterfactual, not an index return: identical cash flows on identical dates into IVV.AX with distributions reinvested. Its prices before July 2024 are reconstructed from financial-year closes and reported calendar-year returns.",
  "Portfolio values are observed at four year-ends only. There are no intra-year marks and none have been interpolated.",
  "All figures are net of brokerage, before tax, and exclude franking credits. Including franking lifts XIRR to 12.52%.",
];
