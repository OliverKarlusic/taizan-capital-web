/**
 * Shared shapes and constants for the company research surface.
 *
 * ── WHY THESE MOVED OUT OF CompanyClient ────────────────────────────
 * That file had grown to 1,894 lines holding the page, thirteen tab
 * panels, every table and every type. Each of the v2 modules planned on
 * top of it — comps, valuation, tooltips — has to touch it, and a file
 * that size makes every one of those changes riskier than it needs to
 * be. These declarations are the part that several modules share, so
 * they come out first and the panels follow.
 *
 * Nothing here changes behaviour. It is the same code in a smaller
 * room.
 */


import type {
  BalanceSheet,
  CashFlow,
  IncomeStatement,
} from "@/lib/research/statements";

/**
 * `issuer: true` marks a section that only exists for an operating
 * company.
 *
 * ── WHY A FUND MUST NOT BE OFFERED THESE ────────────────────────────
 * An index fund has no income statement, no return on invested capital
 * and no insider register. Offering the tabs anyway meant an ETF landed
 * on "This section's data could not be retrieved — reload to try the
 * feed again", which is false twice over: nothing failed, and reloading
 * will never produce a figure. That is the same error as a fabricated
 * number wearing different clothes — the reader is told something
 * untrue about why a figure is absent, and sent to do something futile
 * about it.
 *
 * A structural absence and a failed request are different facts and get
 * different words.
 */
export const TABS = [
  { id: "overview", label: "Overview", live: true, issuer: false },
  { id: "valuation", label: "Valuation", live: true, issuer: false },
  { id: "growth", label: "Growth & Profitability", live: true, issuer: true },
  { id: "risk", label: "Risk", live: true, issuer: false },
  { id: "financials", label: "Financials", live: true, issuer: true },
  { id: "balance", label: "Balance Sheet", live: true, issuer: true },
  { id: "cashflow", label: "Cash Flow", live: true, issuer: true },
  { id: "quality", label: "Quality", live: true, issuer: true },
  { id: "peers", label: "Peers", live: true, issuer: true },
  { id: "ownership", label: "Ownership", live: true, issuer: true },
  { id: "filings", label: "News & Filings", live: true, issuer: false },
  { id: "calendar", label: "Calendar", live: true, issuer: false },
  { id: "thesis", label: "Thesis", live: false, issuer: false },
] as const;

/**
 * Yahoo's quoteType for things that are funds rather than issuers.
 * MUTUALFUND and MONEYMARKET are included because the same reasoning
 * applies to them, even though the screener universe is equities and
 * ETFs today.
 */
export const FUND_TYPES = new Set(["ETF", "MUTUALFUND", "MONEYMARKET"]);
export const isFund = (quoteType: string | null | undefined) =>
  FUND_TYPES.has((quoteType ?? "").toUpperCase());

/** Tabs whose data comes from the second, lazily-fetched request. */
export const DETAIL_TABS = new Set([
  "financials",
  "balance",
  "cashflow",
  "quality",
  "peers",
  "ownership",
  "filings",
  "calendar",
]);

export type TabId = (typeof TABS)[number]["id"];

export const UNAVAILABLE: Record<string, { title: string; reason: string }> = {
  thesis: {
    title: "Investment thesis",
    reason:
      "Held for a later phase, and constrained when it arrives: it will describe how Taizan Capital reads a business — what the firm looks at and what it has concluded about its own holding — and it will not tell a reader what to do. A thesis that recommends is advice, and the firm is not licensed to give it. Nothing is drafted here in the meantime.",
  },
};

export interface EstimatePeriodView {
  period: string;
  endDate: string | null;
  epsAvg: number | null;
  epsLow: number | null;
  epsHigh: number | null;
  epsAnalysts: number | null;
  epsYearAgo: number | null;
  revenueAvg: number | null;
  revenueLow: number | null;
  revenueHigh: number | null;
  revenueAnalysts: number | null;
  revenueYearAgo: number | null;
  currency: string | null;
}

export interface DistributionView {
  date: number;
  amount: number;
}

export interface DetailPayload {
  estimates?: EstimatePeriodView[];
  distributions?: DistributionView[];
  distributionsTimezone?: string | null;
  income: {
    endDate: string | null;
    totalRevenue: number | null;
    costOfRevenue: number | null;
    grossProfit: number | null;
    researchDevelopment: number | null;
    sellingGeneralAdministrative: number | null;
    totalOperatingExpenses: number | null;
    operatingIncome: number | null;
    ebit: number | null;
    interestExpense: number | null;
    incomeBeforeTax: number | null;
    incomeTaxExpense: number | null;
    netIncome: number | null;
  }[];
  ownership: {
    insidersPercentHeld: number | null;
    institutionsPercentHeld: number | null;
    institutionsCount: number | null;
    topHolders: {
      organization: string;
      reportDate: string | null;
      pctHeld: number | null;
      position: number | null;
      value: number | null;
    }[];
    insiders: { name: string; relation: string | null; transaction: string | null; date: string | null }[];
  };
  calendar: {
    earningsDate: string | null;
    earningsDateIsEstimate: boolean;
    exDividendDate: string | null;
    dividendDate: string | null;
  };
  filings: { date: string; type: string; title: string; url: string | null }[];
  filingsUnsupported: boolean;
  news: { title: string; publisher: string | null; link: string; published: string | null }[];
  peers: {
    symbol: string;
    name: string | null;
    marketCap: number | null;
    trailingPE: number | null;
    priceToBook: number | null;
    dividendYield: number | null;
  }[];
  peerBasis: { sector: string | null; index: string | null };
  currency: string | null;
  balanceSheetEmpty: boolean;
  cashFlowEmpty: boolean;
  statements?: {
    coverage: "covered" | "out-of-coverage" | "not-configured";
    source: string | null;
    income: IncomeStatement[] | null;
    balance: BalanceSheet[] | null;
    cashFlow: CashFlow[] | null;
  };
}

/** Large money, compactly — statements run to twelve digits. */