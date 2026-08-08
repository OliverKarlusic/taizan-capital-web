import { CONVICTIONS } from "@/lib/portfolio";

/**
 * Quarterly performance and reporting.
 *
 * ── WHY THIS IS A TIME SERIES ───────────────────────────────────────
 * The previous version of this file held one snapshot per strategy —
 * quarter, one year, since inception. Every new quarter would have
 * overwritten the last, so the site could never have shown Q1 beside Q2,
 * never charted anything, and never demonstrated consistency, which is the
 * only thing a track record is actually for. Changed before the first
 * figure was entered, while there was nothing to migrate.
 *
 * Returns are numbers here, not display strings. Cumulative performance
 * has to be chain-linked, and you cannot multiply "+3.14%".
 *
 * ── HOW TO PUBLISH A QUARTER ────────────────────────────────────────
 * 1. Reconcile the quarter against broker statements. Not an estimate,
 *    not a spreadsheet you maintain by hand — the actual records.
 * 2. Put the PDF in public/media/reports/  e.g. taizan-2027-q1.pdf
 * 3. Append one QuarterRecord to QUARTERS below, oldest first.
 * 4. Deploy.
 *
 * No database, no CMS, no running cost. The reports are static files and
 * the manifest is a typed list, which cannot silently serve a
 * half-uploaded file the way a database row can.
 *
 * ── ON THE NUMBERS ──────────────────────────────────────────────────
 * QUARTERS is empty. Not zeroed, not seeded with an example — empty, so
 * every "no track record yet" in the UI is derived from the data rather
 * than hardcoded, and the day real figures arrive the empty states
 * disappear on their own.
 *
 * Publishing a return before it is reconciled is the one mistake on this
 * website that cannot be quietly corrected later.
 */

/**
 * A return as a decimal fraction: 0.0314 is +3.14%, -0.021 is -2.10%.
 * Null means no measurement exists — never zero, which is a real result.
 */
export type Return = number | null;

export interface Quarter {
  /** Sort key and URL fragment, e.g. "2027-q1". */
  id: string;
  /** Display label, e.g. "Q1 2027". */
  label: string;
  /** Period covered, e.g. "January – March 2027". */
  period: string;
  /** ISO date the quarter ended. */
  ends: string;
}

export interface QuarterRecord {
  quarter: Quarter;
  /** Fund-level time-weighted return for the quarter. */
  fund: Return;
  /** The stated benchmark over the identical period. */
  benchmark: Return;
  /**
   * Strategy slug to its return for the quarter. A slug absent from this
   * map held no capital that quarter — which the table reports as "not
   * funded" rather than as a zero return.
   */
  strategies: Record<string, Return>;
  report: {
    /** Path under /public. Null until the PDF exists. */
    href: string | null;
    /** ISO date published. */
    published: string | null;
    /** One line on what the quarter covered. */
    summary: string | null;
  };
}

/**
 * Every closed quarter, oldest first. Empty until the first one is
 * reconciled and published.
 *
 * A populated entry looks like this:
 *
 *   {
 *     quarter: {
 *       id: "2027-q1",
 *       label: "Q1 2027",
 *       period: "January – March 2027",
 *       ends: "2027-03-31",
 *     },
 *     fund: 0.0314,
 *     benchmark: 0.0271,
 *     strategies: { "long-term-growth": 0.0402, "passive-income": 0.0188 },
 *     report: {
 *       href: "/media/reports/taizan-2027-q1.pdf",
 *       published: "2027-04-18",
 *       summary: "Positioning, material changes and commentary.",
 *     },
 *   }
 */
export const QUARTERS: QuarterRecord[] = [];

/**
 * Chain-links periodic returns into one cumulative return.
 *
 * Returns null if any period in the series is missing. A cumulative figure
 * computed across a hole is not a cumulative figure, and quietly skipping
 * the gap would overstate a record by omitting whichever quarter went
 * unmeasured.
 */
export function chainLink(returns: Return[]): Return {
  if (returns.length === 0 || returns.some((r) => r === null)) return null;
  return (returns as number[]).reduce((acc, r) => acc * (1 + r), 1) - 1;
}

/**
 * Annualises a cumulative return measured over `quarters` quarters.
 *
 * Null below four quarters, deliberately and unconditionally. Annualising
 * a strong first quarter into a headline "per annum" figure is the classic
 * emerging-manager misrepresentation, and the protection against it should
 * be a function that refuses rather than a rule someone has to remember.
 */
export function annualise(cumulative: Return, quarters: number): Return {
  if (cumulative === null || quarters < 4) return null;
  return Math.pow(1 + cumulative, 4 / quarters) - 1;
}

/** "+3.14%", "-2.10%", or an em dash when there is no measurement. */
export function formatReturn(r: Return): string {
  if (r === null) return "—";
  return `${r >= 0 ? "+" : ""}${(r * 100).toFixed(2)}%`;
}

export interface StrategySeries {
  slug: string;
  name: string;
  /** One entry per quarter in QUARTERS, aligned by index. */
  byQuarter: Return[];
  /** Chain-linked across every quarter the strategy was funded. */
  cumulative: Return;
  /** False when the strategy has never held capital. */
  funded: boolean;
}

export const STRATEGY_SERIES: StrategySeries[] = CONVICTIONS.map((c) => {
  const byQuarter = QUARTERS.map((q) =>
    c.slug in q.strategies ? q.strategies[c.slug] : null,
  );
  const funded = byQuarter.some((r) => r !== null);
  return {
    slug: c.slug,
    name: c.name,
    byQuarter,
    // Chain-link only the quarters the strategy actually ran, so a
    // strategy funded in Q3 is not penalised for Q1 and Q2.
    cumulative: funded
      ? chainLink(byQuarter.filter((r) => r !== null))
      : null,
    funded,
  };
});

export const FUND_CUMULATIVE = chainLink(QUARTERS.map((q) => q.fund));
export const BENCHMARK_CUMULATIVE = chainLink(QUARTERS.map((q) => q.benchmark));
export const FUND_ANNUALISED = annualise(FUND_CUMULATIVE, QUARTERS.length);

export const hasPerformance = QUARTERS.some((q) => q.fund !== null);
export const hasReports = QUARTERS.some((q) => q.report.href !== null);
export const LATEST: QuarterRecord | null =
  QUARTERS.length > 0 ? QUARTERS[QUARTERS.length - 1] : null;

/**
 * The calculation basis, published before there is anything to calculate.
 *
 * This is the point of it. Committing to a method while the results are
 * unknown is the difference between a methodology and a justification —
 * nobody can suggest the flattering measure was chosen once the outcome
 * was visible. It costs nothing now and cannot be acquired later.
 */
export const METHODOLOGY: { term: string; body: string }[] = [
  {
    term: "Calculation basis",
    body: "Returns are time-weighted. The period is divided at every external cash flow, each sub-period is calculated separately, and the results are chain-linked. This removes the effect of when capital was contributed or withdrawn, and measures the strategy rather than the timing of deposits. A simple start-to-end calculation over a period containing contributions overstates the return, sometimes by a wide margin, and is not used here.",
  },
  {
    term: "Investor-level returns",
    body: "Time-weighted returns describe the strategy, not any individual's experience. An investor whose capital arrived at a different time earned a different result. Money-weighted returns, which reflect actual contribution timing, are reported to individual investors directly and are not published here.",
  },
  {
    term: "Benchmark",
    body: "Australian equity exposure is measured against the S&P/ASX 200 Accumulation Index and United States exposure against the S&P 500 Total Return Index, blended to the portfolio's actual exposure and stated each quarter. Accumulation and total-return indices are used because they include dividends. A price index does not, and benchmarking against one would flatter these figures by several percent a year.",
  },
  {
    term: "Currency",
    body: "All figures are in Australian dollars. Holdings on the NYSE and Nasdaq are translated at the rate applying on the measurement date, so movement in the Australian dollar forms part of the reported return. A United States holding can rise in US dollar terms and fall in Australian dollar terms, and the reported figure is the one that reflects what the capital is actually worth.",
  },
  {
    term: "Fees",
    body: "No management fee, performance fee or other charge is currently levied, so gross and net returns are identical. This is stated rather than left implied. If a fee is introduced, figures will be reported net of it and the change will be disclosed in the quarter it takes effect.",
  },
  {
    term: "Annualisation",
    body: "No return is annualised over a period shorter than twelve months. Projecting a single quarter to a per-annum figure produces a number that has never occurred, and it is the most common way a short record is made to look like a long one.",
  },
  {
    term: "Selection of periods",
    body: "Every quarter since inception is published, in order, including negative ones. No period is selected for presentation, no starting point is chosen for its convenience, and no quarter is omitted. A record that only shows its better periods is not a record.",
  },
  {
    term: "Source and verification",
    body: "Figures are derived from broker and custodian records and reconciled against statements before publication. They are not internal estimates, projections, simulations or back-tests, none of which appear anywhere on this website.",
  },
  {
    term: "Corrections",
    body: "If a published figure is later found to be wrong it will be corrected, and the correction disclosed alongside the original, rather than silently amended.",
  },
  {
    term: "Standards",
    body: "These figures do not claim compliance with the Global Investment Performance Standards. GIPS compliance is a formal, verified claim, and asserting it without verification is itself a misrepresentation. The methodology above follows its principles on time-weighting, period selection and disclosure.",
  },
];

/** When quarters close and when reports follow. */
export const REPORTING_CALENDAR = {
  quarterEnds: "31 March, 30 June, 30 September and 31 December",
  publicationWindow: "within six weeks of each quarter end",
};
