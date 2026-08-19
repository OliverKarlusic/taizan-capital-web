import { z } from "zod";
import { budgeter } from "./budget";

/**
 * Financial statements, from a dedicated statements provider.
 *
 * ── WHY A SECOND PROVIDER ───────────────────────────────────────────
 * The quote provider returns balance-sheet and cash-flow periods with
 * every line item stripped, and most of the income statement too — each
 * statement arrives carrying little more than an end date. That single
 * gap blocks the balance sheet, the cash flow statement, ROIC, working
 * capital, capital allocation, earnings quality and any DCF worth the
 * name. No amount of application code fixes a field the source does not
 * send.
 *
 * This adapter fills it from Financial Modeling Prep, behind the same
 * shape the rest of the terminal already speaks.
 *
 * ── IT IS OPTIONAL, AND ABSENCE IS NOT FAILURE ──────────────────────
 * With no FMP_API_KEY set, every function here returns null and the
 * terminal shows exactly what it shows today: the statement is
 * unavailable, with the reason named. The site builds, deploys and runs
 * without a key, and nothing degrades into a placeholder when one is
 * missing.
 *
 * ── ONE COVERAGE LIMIT, STATED RATHER THAN DISCOVERED ───────────────
 * The provider's free tier covers US listings only. ASX companies —
 * which are half this terminal's universe, and include two of the firm's
 * own holdings — return nothing on it. That asymmetry is reported
 * explicitly through `coverage`, so a page can say "the statements
 * provider does not cover this exchange" rather than leaving an
 * Australian company looking like one whose filings simply failed to
 * load.
 */

/**
 * The current API, not the documented one.
 *
 * Most of this provider's documentation still describes /api/v3 with the
 * symbol in the path. A key issued today gets HTTP 403 "Legacy Endpoint"
 * on every one of those routes. The live API is /stable with the symbol
 * as a query parameter, and several field names differ from the v3
 * shapes the docs show — epsDiluted rather than epsdiluted,
 * netCashProvidedByInvestingActivities rather than the misspelled v3
 * key. Verified against real responses rather than taken from the docs.
 */
const BASE = "https://financialmodelingprep.com/stable";

/** Absent key means this provider is simply not configured. */
const apiKey = () => process.env.FMP_API_KEY?.trim() || null;

export const isConfigured = () => apiKey() !== null;

/**
 * Whether this provider is expected to carry a given listing.
 *
 * The free tier is US-only. Rather than fire a request that returns an
 * empty array and read that as "this company has no balance sheet", the
 * exchange is checked first and the answer is reported as out of
 * coverage — a different statement, and the true one.
 */
export type Coverage = "covered" | "out-of-coverage" | "not-configured";

/**
 * Checked before the request, not after.
 *
 * A non-US symbol returns HTTP 402 "not available under your plan" — an
 * authoritative answer, but one that costs a request from a 250-a-day
 * budget to obtain. The suffix test is a free fast path to the same
 * conclusion, and the 402 is still handled below for anything it misses.
 */
export function coverageFor(symbol: string): Coverage {
  if (!isConfigured()) return "not-configured";
  return /\.[A-Z]{1,3}$/i.test(symbol) ? "out-of-coverage" : "covered";
}

/* ── shapes ───────────────────────────────────────────────────────── */

/**
 * The provider sends bare JSON numbers and omits or nulls what it lacks.
 * Unlike the quote provider it has no placeholder-zero convention, but
 * the same discipline applies: absent is null, never 0.
 */
const num = z.unknown().transform((v): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null,
);

const str = z.unknown().transform((v): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null,
);

export interface StatementPeriod {
  date: string | null;
  fiscalYear: string | null;
  period: string | null;
  currency: string | null;
}

export interface IncomeStatement extends StatementPeriod {
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  researchAndDevelopment: number | null;
  sellingGeneralAndAdministrative: number | null;
  operatingExpenses: number | null;
  operatingIncome: number | null;
  ebitda: number | null;
  ebit: number | null;
  depreciationAndAmortization: number | null;
  interestExpense: number | null;
  incomeBeforeTax: number | null;
  incomeTaxExpense: number | null;
  netIncome: number | null;
  eps: number | null;
  epsDiluted: number | null;
  weightedAverageShsOutDil: number | null;
}

export interface BalanceSheet extends StatementPeriod {
  cashAndCashEquivalents: number | null;
  shortTermInvestments: number | null;
  netReceivables: number | null;
  inventory: number | null;
  totalCurrentAssets: number | null;
  propertyPlantEquipmentNet: number | null;
  goodwill: number | null;
  intangibleAssets: number | null;
  totalAssets: number | null;
  accountPayables: number | null;
  shortTermDebt: number | null;
  totalCurrentLiabilities: number | null;
  longTermDebt: number | null;
  totalLiabilities: number | null;
  totalStockholdersEquity: number | null;
  totalDebt: number | null;
  netDebt: number | null;
}

export interface CashFlow extends StatementPeriod {
  netIncome: number | null;
  depreciationAndAmortization: number | null;
  stockBasedCompensation: number | null;
  changeInWorkingCapital: number | null;
  netCashProvidedByOperatingActivities: number | null;
  capitalExpenditure: number | null;
  acquisitionsNet: number | null;
  netCashUsedForInvestingActivities: number | null;
  debtRepayment: number | null;
  commonStockRepurchased: number | null;
  dividendsPaid: number | null;
  netCashUsedProvidedByFinancingActivities: number | null;
  freeCashFlow: number | null;
}

const period = (r: Record<string, unknown>): StatementPeriod => ({
  date: str.parse(r.date),
  fiscalYear: str.parse(r.calendarYear),
  period: str.parse(r.period),
  currency: str.parse(r.reportedCurrency),
});

/* ── fetching ─────────────────────────────────────────────────────── */

type Entry = { value: unknown; expires: number };
const cache = new Map<string, Entry>();

/**
 * Statements change quarterly; the free tier allows 250 requests a day.
 * A twelve-hour cache means a company is fetched at most twice a day no
 * matter how many people open its page, which is what keeps a public
 * site inside that budget.
 */
const TTL = 12 * 60 * 60_000;

async function get<T>(
  endpoint: string,
  symbol: string,
  limit: number,
  parse: (rows: Record<string, unknown>[]) => T[],
): Promise<T[] | null> {
  const key = apiKey();
  if (!key) return null;
  if (coverageFor(symbol) === "out-of-coverage") return null;

  const path = `${endpoint}?symbol=${encodeURIComponent(symbol)}&limit=${limit}`;
  const hit = cache.get(path);
  if (hit && hit.expires > Date.now()) return hit.value as T[];

  try {
    // Budgeted and deduplicated. FMP's free plan allows 250 calls a
    // day, which a single screener page view could otherwise spend a
    // meaningful fraction of. The dedupe key omits the API key so the
    // secret never becomes part of a map key that might be logged.
    const r = await budgeter.run("fmp", path, () =>
      fetch(`${BASE}/${path}&apikey=${encodeURIComponent(key)}`, {
        headers: { "User-Agent": "taizan-capital-research" },
      }),
    );
    // 402 is the plan boundary, 403 a retired route, 429 the daily cap.
    // None of them is data, and none becomes a zero.
    if (!r.ok) return null;
    const j = await r.json();
    if (!Array.isArray(j) || !j.length) return null;
    const value = parse(j as Record<string, unknown>[]);
    cache.set(path, { value, expires: Date.now() + TTL });
    return value;
  } catch {
    return null;
  }
}

export const getIncomeStatements = (symbol: string, limit = 10) =>
  get<IncomeStatement>("income-statement", symbol, limit, (rows) =>
    rows.map((r) => ({
      ...period(r),
      revenue: num.parse(r.revenue),
      costOfRevenue: num.parse(r.costOfRevenue),
      grossProfit: num.parse(r.grossProfit),
      researchAndDevelopment: num.parse(r.researchAndDevelopmentExpenses),
      sellingGeneralAndAdministrative: num.parse(
        r.sellingGeneralAndAdministrativeExpenses,
      ),
      operatingExpenses: num.parse(r.operatingExpenses),
      operatingIncome: num.parse(r.operatingIncome),
      ebitda: num.parse(r.ebitda),
      ebit: num.parse(r.ebit),
      depreciationAndAmortization: num.parse(r.depreciationAndAmortization),
      interestExpense: num.parse(r.interestExpense),
      incomeBeforeTax: num.parse(r.incomeBeforeTax),
      incomeTaxExpense: num.parse(r.incomeTaxExpense),
      netIncome: num.parse(r.netIncome),
      eps: num.parse(r.eps),
      epsDiluted: num.parse(r.epsDiluted),
      weightedAverageShsOutDil: num.parse(r.weightedAverageShsOutDil),
    })),
  );

export const getBalanceSheets = (symbol: string, limit = 10) =>
  get<BalanceSheet>("balance-sheet-statement", symbol, limit, (rows) =>
    rows.map((r) => ({
      ...period(r),
      cashAndCashEquivalents: num.parse(r.cashAndCashEquivalents),
      shortTermInvestments: num.parse(r.shortTermInvestments),
      netReceivables: num.parse(r.netReceivables),
      inventory: num.parse(r.inventory),
      totalCurrentAssets: num.parse(r.totalCurrentAssets),
      propertyPlantEquipmentNet: num.parse(r.propertyPlantEquipmentNet),
      goodwill: num.parse(r.goodwill),
      intangibleAssets: num.parse(r.intangibleAssets),
      totalAssets: num.parse(r.totalAssets),
      accountPayables: num.parse(r.accountPayables),
      shortTermDebt: num.parse(r.shortTermDebt),
      totalCurrentLiabilities: num.parse(r.totalCurrentLiabilities),
      longTermDebt: num.parse(r.longTermDebt),
      totalLiabilities: num.parse(r.totalLiabilities),
      totalStockholdersEquity: num.parse(r.totalStockholdersEquity),
      totalDebt: num.parse(r.totalDebt),
      netDebt: num.parse(r.netDebt),
    })),
  );

export const getCashFlows = (symbol: string, limit = 10) =>
  get<CashFlow>("cash-flow-statement", symbol, limit, (rows) =>
    rows.map((r) => ({
      ...period(r),
      netIncome: num.parse(r.netIncome),
      depreciationAndAmortization: num.parse(r.depreciationAndAmortization),
      stockBasedCompensation: num.parse(r.stockBasedCompensation),
      changeInWorkingCapital: num.parse(r.changeInWorkingCapital),
      // Both keys exist on this endpoint and agree; the explicit one is
      // preferred and the other is the fallback.
      netCashProvidedByOperatingActivities: num.parse(
        r.operatingCashFlow ?? r.netCashProvidedByOperatingActivities,
      ),
      capitalExpenditure: num.parse(r.capitalExpenditure),
      acquisitionsNet: num.parse(r.acquisitionsNet),
      netCashUsedForInvestingActivities: num.parse(
        r.netCashProvidedByInvestingActivities,
      ),
      debtRepayment: num.parse(r.longTermNetDebtIssuance),
      commonStockRepurchased: num.parse(r.commonStockRepurchased),
      dividendsPaid: num.parse(r.netDividendsPaid ?? r.commonDividendsPaid),
      netCashUsedProvidedByFinancingActivities: num.parse(
        r.netCashProvidedByFinancingActivities,
      ),
      freeCashFlow: num.parse(r.freeCashFlow),
    })),
  );
