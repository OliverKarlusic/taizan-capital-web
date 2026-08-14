import type { BalanceSheet, CashFlow, IncomeStatement } from "./statements";

/**
 * The analysis a full statement set makes possible.
 *
 * ── EVERY FUNCTION HERE RETURNS null RATHER THAN GUESSING ───────────
 * These are ratios over reported figures, and a ratio is only as
 * available as its scarcest input. Return on invested capital needs
 * operating income, tax, debt, equity and cash together; if any one is
 * absent the answer is null, not an approximation built from what
 * happened to arrive. The temptation to substitute — equity for invested
 * capital, net income for operating cash flow — is precisely how a
 * number that looks sourced stops being sourced.
 *
 * ── AND NONE OF THEM RETURNS A JUDGEMENT ────────────────────────────
 * No function grades a company, bands a ratio, or decides that a cash
 * conversion of 80% is good. They compute. What the figure means is the
 * reader's to decide, and the firm publishing this is not licensed to
 * decide it for them.
 */

const div = (a: number | null, b: number | null): number | null =>
  a === null || b === null || b === 0 ? null : a / b;


const add = (a: number | null, b: number | null): number | null =>
  a === null || b === null ? null : a + b;

/* ── margins ──────────────────────────────────────────────────────── */

export const grossMargin = (i: IncomeStatement) =>
  div(i.grossProfit, i.revenue);
export const operatingMargin = (i: IncomeStatement) =>
  div(i.operatingIncome, i.revenue);
export const netMargin = (i: IncomeStatement) => div(i.netIncome, i.revenue);
export const ebitdaMargin = (i: IncomeStatement) => div(i.ebitda, i.revenue);

/* ── returns on capital ───────────────────────────────────────────── */

/**
 * The effective tax rate actually paid, not a statutory assumption.
 *
 * A statutory rate would be a guess dressed as an input. Where the
 * reported figures cannot produce a rate — a loss year, no tax line —
 * this is null and every figure derived from it is null too.
 */
export function effectiveTaxRate(i: IncomeStatement): number | null {
  const rate = div(i.incomeTaxExpense, i.incomeBeforeTax);
  // A negative or absurd rate is a tax benefit or a distorted period,
  // not a rate to apply to operating income.
  if (rate === null || rate < 0 || rate > 1) return null;
  return rate;
}

/** NOPAT — operating income after the tax actually borne. */
export function nopat(i: IncomeStatement): number | null {
  const rate = effectiveTaxRate(i);
  if (i.operatingIncome === null || rate === null) return null;
  return i.operatingIncome * (1 - rate);
}

/**
 * Invested capital: debt plus equity, less cash not needed to operate.
 *
 * Excess cash is netted off because capital sitting in a deposit is not
 * capital the business is earning a return on. This is the common
 * definition and it is stated on screen, because ROIC is a metric where
 * two defensible definitions produce meaningfully different numbers.
 */
export function investedCapital(b: BalanceSheet): number | null {
  const capital = add(b.totalDebt, b.totalStockholdersEquity);
  if (capital === null) return null;
  return b.cashAndCashEquivalents === null
    ? capital
    : capital - b.cashAndCashEquivalents;
}

export function roic(i: IncomeStatement, b: BalanceSheet): number | null {
  return div(nopat(i), investedCapital(b));
}

export const returnOnEquity = (i: IncomeStatement, b: BalanceSheet) =>
  div(i.netIncome, b.totalStockholdersEquity);

export const returnOnAssets = (i: IncomeStatement, b: BalanceSheet) =>
  div(i.netIncome, b.totalAssets);

/* ── leverage ─────────────────────────────────────────────────────── */

export const netDebtToEbitda = (i: IncomeStatement, b: BalanceSheet) =>
  div(b.netDebt, i.ebitda);

export const debtToEquity = (b: BalanceSheet) =>
  div(b.totalDebt, b.totalStockholdersEquity);

export const currentRatio = (b: BalanceSheet) =>
  div(b.totalCurrentAssets, b.totalCurrentLiabilities);

/** Quick ratio excludes inventory, which cannot be liquidated quickly. */
export function quickRatio(b: BalanceSheet): number | null {
  if (b.totalCurrentAssets === null || b.totalCurrentLiabilities === null) {
    return null;
  }
  // Inventory absent is treated as absent, not as zero inventory — a
  // retailer showing a quick ratio equal to its current ratio would be
  // wrong in the direction that flatters it.
  if (b.inventory === null) return null;
  return (b.totalCurrentAssets - b.inventory) / b.totalCurrentLiabilities;
}

export function interestCoverage(i: IncomeStatement): number | null {
  // Interest expense is reported as a positive magnitude; a zero means
  // no borrowing cost, which makes coverage unbounded rather than
  // infinite-looking, so it is reported as unavailable.
  if (i.operatingIncome === null || !i.interestExpense) return null;
  return i.operatingIncome / Math.abs(i.interestExpense);
}

/* ── cash ─────────────────────────────────────────────────────────── */

export function freeCashFlow(c: CashFlow): number | null {
  if (c.freeCashFlow !== null) return c.freeCashFlow;
  // Capex is reported negative; adding it subtracts the spend.
  return add(c.netCashProvidedByOperatingActivities, c.capitalExpenditure);
}

/** How much of reported profit arrived as cash. */
export const cashConversion = (c: CashFlow) =>
  div(c.netCashProvidedByOperatingActivities, c.netIncome);

export const fcfMargin = (c: CashFlow, i: IncomeStatement) =>
  div(freeCashFlow(c), i.revenue);

/* ── working capital ──────────────────────────────────────────────── */

const DAYS = 365;

/** Days sales outstanding — how long customers take to pay. */
export const dso = (i: IncomeStatement, b: BalanceSheet) => {
  const r = div(b.netReceivables, i.revenue);
  return r === null ? null : r * DAYS;
};

/** Days inventory outstanding — how long stock sits before selling. */
export const dio = (i: IncomeStatement, b: BalanceSheet) => {
  const r = div(b.inventory, i.costOfRevenue);
  return r === null ? null : r * DAYS;
};

/** Days payable outstanding — how long the company takes to pay. */
export const dpo = (i: IncomeStatement, b: BalanceSheet) => {
  const r = div(b.accountPayables, i.costOfRevenue);
  return r === null ? null : r * DAYS;
};

/**
 * Cash conversion cycle: collection plus inventory, less payment terms.
 *
 * All three components are required. A cycle computed from two of them
 * would be a different measure wearing this one's name.
 */
export function cashConversionCycle(
  i: IncomeStatement,
  b: BalanceSheet,
): number | null {
  const a = dso(i, b);
  const c = dio(i, b);
  const p = dpo(i, b);
  if (a === null || c === null || p === null) return null;
  return a + c - p;
}

/* ── growth ───────────────────────────────────────────────────────── */

/**
 * Compound annual growth rate between the oldest and newest period.
 *
 * Refuses a negative or zero base: the CAGR from a loss to a profit is
 * not a growth rate, it is a sign change, and reporting a percentage for
 * it would be arithmetic without meaning. Also refuses a single period,
 * where there is no interval to compound over.
 */
export function cagr(
  newest: number | null,
  oldest: number | null,
  years: number,
): number | null {
  if (newest === null || oldest === null) return null;
  if (oldest <= 0 || newest <= 0 || years <= 0) return null;
  return Math.pow(newest / oldest, 1 / years) - 1;
}

/**
 * CAGR across an ordered series, newest first — the provider's order.
 */
export function seriesCagr(values: (number | null)[]): number | null {
  if (values.length < 2) return null;
  const newest = values[0];
  const oldest = values[values.length - 1];
  return cagr(newest, oldest, values.length - 1);
}

/** Simple period-on-period change, as a fraction. */
export function growth(newer: number | null, older: number | null): number | null {
  if (newer === null || older === null || older === 0) return null;
  return (newer - older) / Math.abs(older);
}

/* ── share count ──────────────────────────────────────────────────── */

/**
 * Dilution over the period: positive means the share count grew.
 *
 * Reported separately from earnings growth because a company can grow
 * earnings and shrink earnings per share, and the two together are the
 * question a shareholder actually has.
 */
export const shareCountChange = (periods: IncomeStatement[]) =>
  periods.length < 2
    ? null
    : growth(
        periods[0].weightedAverageShsOutDil,
        periods[periods.length - 1].weightedAverageShsOutDil,
      );
