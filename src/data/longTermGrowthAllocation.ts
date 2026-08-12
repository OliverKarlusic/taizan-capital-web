/**
 * Long Term Growth — portfolio allocation.
 *
 * Corrected attribution. This snapshot was first published against Growth
 * Maximisation, which was wrong: that strategy holds MSFT, VUG and SMH.
 * The holdings below — three index funds and two direct positions, just
 * over half of it Australian — are the Long Term Growth portfolio, and the
 * composition is the tell. Growth Maximisation is a concentrated US growth
 * mandate; this is not that.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────
 * Source: public/media/Charts and Graphs/30-June-2026 chart.png, a broker
 * allocation report dated 30 June 2026. Every weight below is transcribed
 * from that report. Nothing here is estimated, modelled or interpolated.
 *
 * This is a point-in-time snapshot, not a series. There is no allocation
 * history in the repository, so the site must not imply this was the
 * allocation on any other date.
 *
 * ── WHAT IS DELIBERATELY ABSENT ─────────────────────────────────────
 * No performance figures. The transaction history needed to compute a
 * defensible return does not exist in this repository, and the only
 * performance artefact available is a screenshot of a chart — a picture of
 * data, not data. Reading pixel positions into numbers would produce a
 * file that looks precise and is invented.
 *
 * No look-through sector exposure either. 83% of this portfolio is index
 * ETFs, and resolving their true sector weights needs each fund's
 * constituent holdings, which we do not have. The broker's own sector
 * classification is reported as-is, including its large unclassified
 * bucket, because that limitation is itself worth showing.
 */

export interface Holding {
  /** Exchange ticker as it appears on the broker report. */
  code: string;
  name: string;
  /** Percentage of portfolio value. Straight from the report. */
  weight: number;
  /** Index fund or a directly held company. */
  kind: "etf" | "direct";
  market: "Australia" | "United States";
}

/** As reported, largest first. */
export const AS_AT = "30 June 2026";

export const HOLDINGS: Holding[] = [
  {
    code: "IVV",
    name: "iShares S&P 500 ETF",
    weight: 37.25,
    kind: "etf",
    market: "United States",
  },
  {
    code: "VAS",
    name: "Vanguard Australian Shares Index ETF",
    weight: 34.78,
    kind: "etf",
    market: "Australia",
  },
  {
    code: "NXT",
    name: "NextDC",
    weight: 14.37,
    kind: "direct",
    market: "Australia",
  },
  {
    code: "NDQ",
    name: "BetaShares Nasdaq 100 ETF",
    weight: 11.01,
    kind: "etf",
    market: "United States",
  },
  {
    code: "CSL",
    name: "CSL Limited",
    weight: 2.58,
    kind: "direct",
    market: "Australia",
  },
];

/**
 * The broker's sector classification, transcribed exactly.
 *
 * "Unclassified" is the report's "Other". It is not a sector — it is the
 * ETF sleeve, which the broker cannot attribute because a fund is not a
 * company. Relabelled from "Other" because "Other" reads as a residual of
 * small odds and ends, when it is in fact most of the portfolio.
 */
export const REPORTED_SECTORS: { label: string; weight: number }[] = [
  { label: "Unclassified — index funds", weight: 83.05 },
  { label: "Information Technology", weight: 14.37 },
  { label: "Health Care", weight: 2.58 },
];

const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;
const weightsWhere = (fn: (h: Holding) => boolean) =>
  sum(HOLDINGS.filter(fn).map((h) => h.weight));

/**
 * Derived views. Arithmetic on the reported weights only — every figure
 * below is a sum of numbers on the broker report, never a new measurement.
 */
export const BY_MARKET = [
  { label: "Australia", weight: weightsWhere((h) => h.market === "Australia") },
  {
    label: "United States",
    weight: weightsWhere((h) => h.market === "United States"),
  },
];

export const BY_STRUCTURE = [
  { label: "Index funds", weight: weightsWhere((h) => h.kind === "etf") },
  { label: "Direct holdings", weight: weightsWhere((h) => h.kind === "direct") },
];

/**
 * The reported weights total 99.99%, not 100%. That is rounding in the
 * source report, and it is shown rather than silently corrected — nudging
 * a figure to make a column add up is how a transcription becomes an
 * estimate.
 */
export const TOTAL_WEIGHT = sum(HOLDINGS.map((h) => h.weight));
