/**
 * Headline result per strategy, for the Performance page and the homepage.
 *
 * ── THIS FILE CALCULATES NOTHING ────────────────────────────────────
 * Every figure is imported from the strategy's own data module and
 * formatted for display. It used to restate them as string literals,
 * which meant a corrected figure had to be found and changed in two
 * places, and the second place was the one nobody remembered. Now the
 * homepage summary, the Performance table and the strategy page all read
 * the same constant, and a number can only be wrong everywhere at once.
 *
 * There is deliberately no combined figure. Two portfolio returns measured
 * on different bases against different benchmarks over different periods,
 * plus a realised profit from closed options trades, do not add into
 * anything that describes the firm.
 */

import {
  CUMULATIVE as LTG_CUMULATIVE,
  GAP_PP as LTG_GAP_PP,
  INCEPTION as LTG_INCEPTION,
} from "@/data/longTermGrowthPerformance";
import {
  BENCHMARK as GM_BENCHMARK,
  HEADLINE as GM_HEADLINE,
  INCEPTION as GM_INCEPTION,
} from "@/data/growthMaximisationPerformance";
import { TOTAL_REALISED_AUD } from "@/data/optionsResults";

const LTG_TERMINAL = LTG_CUMULATIVE[LTG_CUMULATIVE.length - 1];

/** One decimal, matching the strategy page — the figure is method-sensitive. */
export const LTG_RESULT = `+${LTG_TERMINAL.portfolio.toFixed(1)}%`;
export const LTG_BENCHMARK_RESULT = `+${LTG_TERMINAL.benchmark.toFixed(1)}%`;
/**
 * To the cent, not rounded.
 *
 * This was `Math.round(...)` → "A$3,489", which put "A$3,489 realised" in
 * the Options strategy page's Key Information panel directly above a table
 * reading "A$3,489.23". Same figure, two renderings, 23 cents apart, on one
 * screen. Unlike a return percentage — where extra decimals would claim
 * precision the method has not earned — a realised cash profit is known
 * exactly, so there is no reason to round it anywhere.
 */
export const OPTIONS_RESULT = `A$${TOTAL_REALISED_AUD.toLocaleString("en-AU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

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
    since: `Since ${LTG_INCEPTION}`,
    result: LTG_RESULT,
    note: `Cumulative, time-weighted, against an S&P 500 counterfactual that returned ${LTG_BENCHMARK_RESULT} on the same cash flows — ${LTG_GAP_PP} percentage points ahead. The full record, the basis of calculation and the shortfall are on the strategy page.`,
  },
  {
    name: "Growth Maximisation",
    href: "/portfolios/growth-maximisation",
    since: `Since ${GM_INCEPTION}`,
    result: GM_HEADLINE,
    note: `Approximate, and not reconciled against transaction records, which do not exist in this repository for this strategy. The supplied performance chart is published in full on the strategy page. Benchmarked to the ${GM_BENCHMARK}, which it has trailed.`,
  },
  {
    name: "Options",
    href: "/portfolios/options",
    since: "Two closed positions",
    result: OPTIONS_RESULT,
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
