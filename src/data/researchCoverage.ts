/**
 * What the Research Terminal can and cannot answer.
 *
 * ── THIS IS NOT A DEVELOPER TODO LIST ───────────────────────────────
 * It is an audit of research coverage from an investor's point of view:
 * for each question a serious analyst would ask of a security, can this
 * terminal answer it, partly answer it, or not answer it — and why.
 *
 * "Why" matters more than the state. Most of what is missing here is
 * missing because the free data tier does not carry it, not because the
 * work has not been done, and those are different problems with
 * different fixes. A capability blocked on a licence is marked so, and
 * naming the blocker is the point of the page.
 *
 * Every state below was verified against the live provider, not assumed.
 */

export type CoverageState =
  | "available"
  | "partial"
  | "missing"
  | "blocked"
  | "not-applicable";

export interface Capability {
  name: string;
  state: CoverageState;
  /** What the terminal does today. */
  present: string;
  /** What is absent, and what it would take. Empty when fully available. */
  gap: string;
}

export interface CoverageGroup {
  group: string;
  capabilities: Capability[];
}

export const COVERAGE: CoverageGroup[] = [
  {
    group: "Market data",
    capabilities: [
      {
        name: "Quotes",
        state: "partial",
        present:
          "Last price, change, 52-week range, market state and the provider's own delay figure, labelled as delayed on every surface.",
        gap: "Real time requires an exchange licence. ASX is reported 20 minutes delayed; US lines report zero delay but the free tier carries no real-time entitlement, so nothing is presented as live.",
      },
      {
        name: "Bid / ask / depth",
        state: "missing",
        present: "Not shown.",
        gap: "The batch endpoint carries bid and ask but marks size as a stripped placeholder. Depth needs a market-data licence.",
      },
      {
        name: "Streaming",
        state: "missing",
        present: "Data is fetched per request and cached for 60 seconds.",
        gap: "No WebSocket entitlement on the free tier. The provider layer is isolated behind one module, so a streaming source can be added without touching the UI.",
      },
      {
        name: "Historical prices",
        state: "available",
        present:
          "Daily closes for a year, used for realised volatility, maximum drawdown and range position. Holiday padding is dropped rather than carried forward.",
        gap: "",
      },
    ],
  },
  {
    group: "Security universe",
    capabilities: [
      {
        name: "Equities",
        state: "available",
        present:
          "Any equity the provider covers on ASX, NYSE, Nasdaq and Cboe, reached by name or ticker. Verified against US mega caps, US small caps, ASX large caps and ASX micro caps down to A$24m — 29 of 29 test symbols resolved.",
        gap: "",
      },
      {
        name: "ETFs",
        state: "available",
        present:
          "Classified separately from companies via the provider's security type, so an ETF is never shown a cost-of-revenue line. Verified across five US and five ASX funds.",
        gap: "",
      },
      {
        name: "Bulk security directory",
        state: "missing",
        present:
          "The screener ranks a population of 703 index constituents (S&P 500 and S&P/ASX 200), fetched daily from published lists.",
        gap: "The provider exposes no endpoint listing every security, so the screener cannot rank the full universe — only search can reach it. A provider with a security-master endpoint would remove the distinction.",
      },
    ],
  },
  {
    group: "Financial statements",
    capabilities: [
      {
        name: "Income statement",
        state: "partial",
        present:
          "Four annual periods. Revenue and net income are reported and published.",
        gap: "Cost of revenue, gross profit, operating income, EBIT and tax arrive as stripped placeholders and are shown as unavailable rather than zero. Full statements need a fundamentals provider.",
      },
      {
        name: "Balance sheet",
        state: "missing",
        present: "Not shown.",
        gap: "The provider returns the periods with every line item removed — each arrives carrying only an end date. Nothing is reconstructed from ratios.",
      },
      {
        name: "Cash flow statement",
        state: "missing",
        present: "Not shown.",
        gap: "Same as the balance sheet: periods present, line items stripped. Free cash flow is the figure most worth having, which is why it is not inferred from earnings and an assumed capex rate.",
      },
      {
        name: "Statement history depth",
        state: "partial",
        present: "Four annual periods where the provider carries them.",
        gap: "Five to ten years, quarterly detail and segment splits need a fundamentals provider.",
      },
    ],
  },
  {
    group: "Financial analysis",
    capabilities: [
      {
        name: "Growth and profitability",
        state: "available",
        present:
          "Revenue and earnings growth, gross, operating and net margin, return on equity and return on assets, all as reported by the provider with the period stated.",
        gap: "",
      },
      {
        name: "ROIC / ROCE",
        state: "missing",
        present: "Return on equity and return on assets only.",
        gap: "Invested capital needs balance-sheet detail the provider strips. Deriving it from equity alone would produce a figure that looks like ROIC and is not.",
      },
      {
        name: "Working capital (DSO, DIO, DPO)",
        state: "missing",
        present: "Not shown.",
        gap: "Receivables, inventory and payables are balance-sheet lines, all unavailable.",
      },
      {
        name: "Capital allocation",
        state: "missing",
        present: "Dividend yield and payout ratio only.",
        gap: "Buybacks, acquisitions, capex and debt repayment are cash-flow lines, all unavailable.",
      },
      {
        name: "Earnings quality / cash conversion",
        state: "missing",
        present: "Not shown.",
        gap: "Requires operating cash flow against net income; cash flow is unavailable.",
      },
    ],
  },
  {
    group: "Valuation",
    capabilities: [
      {
        name: "Current multiples",
        state: "available",
        present:
          "Trailing and forward P/E, EV/EBITDA, EV/revenue, price/book, price/sales, PEG, dividend yield and payout.",
        gap: "",
      },
      {
        name: "Peer comparison",
        state: "partial",
        present:
          "A sector-and-size cohort drawn from covered constituents sharing the company's GICS sector, plus sector medians with the sample size stated.",
        gap: "Cohort membership is sector and market cap only. A defensible comparables set needs business-model classification the provider does not supply.",
      },
      {
        name: "Historical valuation",
        state: "missing",
        present: "Not shown.",
        gap: "Needs a multiples time series. The provider returns only the current value of each ratio.",
      },
      {
        name: "DCF",
        state: "blocked",
        present: "Not built.",
        gap: "A DCF needs free cash flow, capex, working capital movement and net debt. Every one of those is a balance-sheet or cash-flow line the provider strips. Building the engine against unavailable inputs would produce a model whose output is an assumption dressed as arithmetic.",
      },
    ],
  },
  {
    group: "Ownership and disclosure",
    capabilities: [
      {
        name: "Institutional ownership",
        state: "available",
        present:
          "Institutional and insider percentages, holder count, and the largest holders with position, value and report date. Works for ASX as well as US listings.",
        gap: "",
      },
      {
        name: "Insider transactions",
        state: "partial",
        present:
          "Name, role, transaction type and date for recent transactions.",
        gap: "Dollar amounts and share counts are not carried by the provider.",
      },
      {
        name: "Short interest",
        state: "missing",
        present: "Not shown.",
        gap: "Not carried on the free tier. ASX publishes daily short positions separately; US requires an exchange feed.",
      },
      {
        name: "Filings",
        state: "partial",
        present: "Recent SEC filings with type, date, title and a link.",
        gap: "SEC filers only — the endpoint 404s for ASX listings. ASX announcements are published on the ASX platform and are not freely redistributable.",
      },
    ],
  },
  {
    group: "News, events and risk",
    capabilities: [
      {
        name: "News",
        state: "partial",
        present:
          "Headlines that name the company, linked to the publisher, with recommendation-phrased items excluded.",
        gap: "The feed pads results with unrelated market stories, so relevance is enforced by requiring the company in the headline. That is strict, and for many listings it returns nothing.",
      },
      {
        name: "Calendar",
        state: "available",
        present:
          "Results date, ex-dividend and dividend payable dates, with provider-estimated dates labelled as estimates rather than presented as confirmed.",
        gap: "",
      },
      {
        name: "Quantitative risk",
        state: "available",
        present:
          "Beta, annualised realised volatility, maximum drawdown on closes, one-year price return and position in the 52-week range, each computed from observed closes with the sample size shown.",
        gap: "",
      },
      {
        name: "Qualitative and industry risk",
        state: "missing",
        present:
          "Per-strategy risk narratives exist on the marketing site, not per security.",
        gap: "Needs filings-derived risk-factor extraction.",
      },
      {
        name: "Industry-specific metrics",
        state: "missing",
        present: "The same metric set is shown for every company.",
        gap: "CET1 and net interest margin for banks, combined ratio for insurers, reserves and grades for miners, ARR and net revenue retention for software, FFO for REITs — none are carried by a general provider.",
      },
    ],
  },
  {
    group: "Workflow",
    capabilities: [
      {
        name: "Screening",
        state: "partial",
        present:
          "Search, market, sector, maximum P/E, minimum yield and minimum market cap across 703 constituents, sorted on any column with missing values held out of both filter and sort.",
        gap: "Growth, margin, balance-sheet, cash-flow and quality filters need fundamentals across the whole population — one request per company against this provider, which is not viable. A custom AND/OR screen builder waits on the same data.",
      },
      {
        name: "Watchlists / thesis monitoring",
        state: "missing",
        present: "Not built.",
        gap: "No persistence layer. This is genuinely unblocked by data and is implementation work.",
      },
      {
        name: "Portfolio analytics",
        state: "missing",
        present:
          "The firm's own strategy records are published on the marketing site.",
        gap: "No holdings-level analytics inside the terminal.",
      },
      {
        name: "Trading ideas",
        state: "partial",
        present:
          "An evidence-gathering research brief runs outside the app as a Claude Code command, constrained to produce no rating, target or recommendation.",
        gap: "Not integrated into the terminal UI, and deliberately so while its output is unreconciled against the terminal's own feed.",
      },
    ],
  },
  {
    group: "Data integrity",
    capabilities: [
      {
        name: "Placeholder detection",
        state: "available",
        present:
          "The provider marks stripped fields as a zero with no formatted value. That pattern is detected at the parse boundary, so a stripped field can never reach the screen as a figure. Verified across US and ASX equities and ETFs, and covered by a regression test built from the exact payload that caused the original defect.",
        gap: "",
      },
      {
        name: "Missing-value discipline",
        state: "available",
        present:
          "Every accessor returns a number or null. Missing renders as an em dash, is excluded from filters rather than passed through, and sorts last in both directions.",
        gap: "",
      },
      {
        name: "Provenance on figures",
        state: "partial",
        present:
          "Every data surface carries a retrieval timestamp, the delay, and the source of the universe. Periods are labelled on statements and peer medians state their sample size.",
        gap: "Provenance is attached per surface rather than per figure. The Sourced<T> type exists for the per-figure version and is not yet threaded through every component.",
      },
      {
        name: "Source reconciliation",
        state: "partial",
        present:
          "Where a figure is unreconciled it is labelled — the Growth Maximisation return, the traced chart series, and anything sourced from outside the terminal's own feed.",
        gap: "No automated cross-source comparison. Discrepancies are surfaced by hand when found, as with the cash and debt difference between NVIDIA's release and the provider.",
      },
    ],
  },
];

/**
 * Coverage score.
 *
 * Deliberately crude and fully stated, because a precise-looking
 * percentage over a subjective checklist is worse than a rough one that
 * shows its working: available counts 1, partial counts 0.5, missing and
 * blocked count 0, and not-applicable is excluded from the denominator.
 * Every capability weighs the same — no weighting is applied, because
 * any weighting would be an opinion presented as arithmetic.
 */
export const SCORE_METHOD =
  "available = 1, partial = 0.5, missing and blocked = 0, not applicable excluded. Every capability weighted equally.";

export function coverageScore(groups: CoverageGroup[] = COVERAGE) {
  const all = groups.flatMap((g) => g.capabilities);
  const scored = all.filter((c) => c.state !== "not-applicable");
  const points = scored.reduce(
    (sum, c) =>
      sum + (c.state === "available" ? 1 : c.state === "partial" ? 0.5 : 0),
    0,
  );
  return {
    points,
    total: scored.length,
    percent: scored.length ? (points / scored.length) * 100 : 0,
    counts: {
      available: all.filter((c) => c.state === "available").length,
      partial: all.filter((c) => c.state === "partial").length,
      missing: all.filter((c) => c.state === "missing").length,
      blocked: all.filter((c) => c.state === "blocked").length,
    },
  };
}
