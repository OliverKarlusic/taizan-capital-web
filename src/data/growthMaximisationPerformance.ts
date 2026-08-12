/**
 * Growth Maximisation — performance.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────
 * The chart is a supplied image, reproduced unaltered. It lives at
 * public/media/Charts and Graphs/ as dropped, and is served from
 * public/media/charts/growth-maximisation-since-inception.png — a
 * byte-identical copy (SHA-256 verified) at a path that survives a URL.
 *
 * Nothing in this file is read off that image. There is no transaction
 * ledger, no valuation series and no daily price history for this
 * strategy anywhere in the repository, so no return series is
 * reconstructed, no curve is redrawn and no figure is interpolated from
 * pixels. The image is the record; this file is its caption.
 *
 * ── WHY THE HEADLINE IS APPROXIMATE ─────────────────────────────────
 * "~+42%" is stated as approximate and carries no decimal place because
 * it is not reconciled against contract notes the way Long Term Growth
 * is. Long Term Growth has four CommSec statements behind it and can
 * support "44.8%". This strategy cannot support "42.0%", so it does not
 * claim it. The tilde is doing real work and must not be tidied away.
 */

/** Served copy of the supplied chart. Byte-identical to the original. */
export const CHART_SRC = "/media/charts/growth-maximisation-since-inception.png";

/** Intrinsic pixel size, so the browser reserves the right box before load. */
export const CHART_SIZE = { width: 1627, height: 452 };

export const INCEPTION = "10 October 2023";
export const BENCHMARK = "Nasdaq-100";

/** Approximate, and deliberately without a decimal place. */
export const HEADLINE = "~+42%";

export const HOLDINGS = [
  { ticker: "MSFT", name: "Microsoft Corporation" },
  { ticker: "VUG", name: "Vanguard Growth ETF" },
  { ticker: "SMH", name: "VanEck Semiconductor ETF" },
];

/**
 * The lag is described, not explained.
 *
 * The repository holds no attribution analysis for this strategy — no
 * position-level contribution, no cash-weighting history, no trade
 * timing. Naming a cause (cash drag, poor timing, stock selection,
 * concentration, a sector call) would be a story invented to fit a gap,
 * and the reader would have no way to know it was invented. The sentence
 * below states the shortfall and stops exactly where the evidence does.
 */
export const COMMENTARY =
  "The portfolio has generated a positive return since inception but has not kept pace with the Nasdaq-100 over the measured period. The difference reflects the portfolio's specific holdings, weighting and timing relative to the benchmark.";

export const CAVEATS = [
  "The chart is drawn from a pixel-level trace of the supplied render, calibrated against that render's own axis. It reproduces the chart; it is not an independent measurement of the portfolio, and the supplied image remains the record. It is linked beneath the chart so the reproduction can be checked against it.",
  "The trace reads the portfolio's closing value at about +43% and the benchmark's at about +101%. The supplied headline figure is ~+42%. The difference is tracing tolerance of roughly a percentage point, not a revision, and neither figure has been reconciled against transaction records.",
  "The horizontal axis carries no dates because the supplied chart carries none. It runs from inception to the end of the supplied record, and no intermediate date should be inferred from a position along it.",
  "Returns are shown before tax. The basis of calculation, the treatment of contributions and the currency basis are not established by the source material and are therefore not claimed here.",
];
