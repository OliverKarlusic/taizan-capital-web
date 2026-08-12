/**
 * Headline result per strategy, for the Performance page.
 *
 * Each figure is the one already published in full on that strategy's own
 * page, restated here so the Performance link in the navigation leads
 * somewhere rather than to an empty quarterly table. Nothing new is
 * calculated: this file points at results, it does not produce them.
 *
 * There is deliberately no combined figure. Two portfolio returns measured
 * on different bases against different benchmarks over different periods,
 * plus a realised profit from closed options trades, do not add into
 * anything that describes the firm.
 */

export interface StrategyResult {
  name: string;
  /** Link to the full record, or null where none exists yet. */
  href: string | null;
  since: string;
  /** Headline figure, or null where no capital has been allocated. */
  result: string | null;
  note: string;
}

export const BY_STRATEGY: StrategyResult[] = [
  {
    name: "Long-Term Growth",
    href: "/portfolios/long-term-growth",
    since: "Since 1 February 2023",
    result: "+44.8%",
    note: "Cumulative, time-weighted, against an S&P 500 counterfactual that returned +85.6% on the same cash flows. The full record, the basis of calculation and the shortfall are on the strategy page.",
  },
  {
    name: "Growth Maximisation",
    href: "/portfolios/growth-maximisation",
    since: "Since 10 October 2023",
    result: "~+42%",
    note: "Approximate, read from the portfolio's own performance chart and not independently reconciled against transaction records, which do not exist in this repository. Benchmarked to the Nasdaq-100, which it has trailed.",
  },
  {
    name: "Options",
    href: "/portfolios/options",
    since: "Two closed positions",
    result: "A$3,489",
    note: "Realised profit across two completed trades, not a portfolio return. No percentage is shown because capital was committed in US dollars and the profit recorded in Australian dollars.",
  },
  {
    name: "Impact Investing",
    href: null,
    since: "Not yet funded",
    result: null,
    note: "No capital has been allocated to this strategy, so there is no result to report. This is not a zero return.",
  },
  {
    name: "Passive Income",
    href: null,
    since: "Not yet funded",
    result: null,
    note: "No capital has been allocated to this strategy, so there is no result to report. This is not a zero return.",
  },
];
