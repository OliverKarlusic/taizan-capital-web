import { describe, expect, it } from "vitest";
import {
  cagr,
  cashConversion,
  cashConversionCycle,
  dio,
  dpo,
  dso,
  effectiveTaxRate,
  freeCashFlow,
  interestCoverage,
  investedCapital,
  nopat,
  quickRatio,
  roic,
  seriesCagr,
  shareCountChange,
} from "./fundamentals";
import type { BalanceSheet, CashFlow, IncomeStatement } from "./statements";

const income = (o: Partial<IncomeStatement> = {}): IncomeStatement => ({
  date: "2026-01-31",
  fiscalYear: "2026",
  period: "FY",
  currency: "USD",
  revenue: 1000,
  costOfRevenue: 400,
  grossProfit: 600,
  researchAndDevelopment: 100,
  sellingGeneralAndAdministrative: 100,
  operatingExpenses: 200,
  operatingIncome: 400,
  ebitda: 450,
  ebit: 400,
  depreciationAndAmortization: 50,
  interestExpense: 20,
  incomeBeforeTax: 380,
  incomeTaxExpense: 95,
  netIncome: 285,
  eps: 2.85,
  epsDiluted: 2.8,
  weightedAverageShsOutDil: 100,
  ...o,
});

const balance = (o: Partial<BalanceSheet> = {}): BalanceSheet => ({
  date: "2026-01-31",
  fiscalYear: "2026",
  period: "FY",
  currency: "USD",
  cashAndCashEquivalents: 200,
  shortTermInvestments: 0,
  netReceivables: 150,
  inventory: 100,
  totalCurrentAssets: 500,
  propertyPlantEquipmentNet: 300,
  goodwill: 100,
  intangibleAssets: 50,
  totalAssets: 1200,
  accountPayables: 80,
  shortTermDebt: 50,
  totalCurrentLiabilities: 250,
  longTermDebt: 350,
  totalLiabilities: 700,
  totalStockholdersEquity: 500,
  totalDebt: 400,
  netDebt: 200,
  ...o,
});

const cash = (o: Partial<CashFlow> = {}): CashFlow => ({
  date: "2026-01-31",
  fiscalYear: "2026",
  period: "FY",
  currency: "USD",
  netIncome: 285,
  depreciationAndAmortization: 50,
  stockBasedCompensation: 30,
  changeInWorkingCapital: -20,
  netCashProvidedByOperatingActivities: 340,
  capitalExpenditure: -60,
  acquisitionsNet: 0,
  netCashUsedForInvestingActivities: -60,
  debtRepayment: -30,
  commonStockRepurchased: -50,
  dividendsPaid: -40,
  netCashUsedProvidedByFinancingActivities: -120,
  freeCashFlow: null,
  ...o,
});

describe("effectiveTaxRate — the rate borne, not assumed", () => {
  it("computes from reported tax and pre-tax income", () => {
    expect(effectiveTaxRate(income())).toBeCloseTo(0.25, 6);
  });

  it("refuses a loss year rather than inventing a rate", () => {
    expect(
      effectiveTaxRate(income({ incomeBeforeTax: -100, incomeTaxExpense: 10 })),
    ).toBeNull();
  });

  it("refuses an out-of-range rate", () => {
    expect(
      effectiveTaxRate(income({ incomeTaxExpense: 500, incomeBeforeTax: 380 })),
    ).toBeNull();
  });

  it("is null when either input is missing", () => {
    expect(effectiveTaxRate(income({ incomeTaxExpense: null }))).toBeNull();
  });
});

describe("ROIC — every input required", () => {
  it("computes NOPAT over invested capital", () => {
    // NOPAT 400 * 0.75 = 300. IC = 400 debt + 500 equity - 200 cash = 700.
    expect(nopat(income())).toBeCloseTo(300, 6);
    expect(investedCapital(balance())).toBe(700);
    expect(roic(income(), balance())).toBeCloseTo(300 / 700, 6);
  });

  it("returns null when the tax rate cannot be established", () => {
    // Not a fallback to a statutory rate — the answer is unavailable.
    expect(roic(income({ incomeBeforeTax: null }), balance())).toBeNull();
  });

  it("returns null when capital cannot be established", () => {
    expect(roic(income(), balance({ totalDebt: null }))).toBeNull();
  });

  it("does not substitute equity for invested capital", () => {
    const ic = investedCapital(balance());
    expect(ic).not.toBe(balance().totalStockholdersEquity);
  });
});

describe("liquidity", () => {
  it("computes the quick ratio excluding inventory", () => {
    // (500 - 100) / 250 = 1.6
    expect(quickRatio(balance())).toBeCloseTo(1.6, 6);
  });

  it("refuses a quick ratio when inventory is unknown", () => {
    // Treating unknown inventory as zero would flatter the ratio, which
    // is the wrong direction to be wrong in.
    expect(quickRatio(balance({ inventory: null }))).toBeNull();
  });

  it("computes interest coverage", () => {
    expect(interestCoverage(income())).toBeCloseTo(20, 6);
  });

  it("reports coverage as unavailable when there is no interest expense", () => {
    expect(interestCoverage(income({ interestExpense: 0 }))).toBeNull();
  });
});

describe("cash", () => {
  it("derives free cash flow when not reported", () => {
    // 340 operating + (-60) capex = 280
    expect(freeCashFlow(cash())).toBe(280);
  });

  it("prefers the reported figure when present", () => {
    expect(freeCashFlow(cash({ freeCashFlow: 275 }))).toBe(275);
  });

  it("computes cash conversion against net income", () => {
    expect(cashConversion(cash())).toBeCloseTo(340 / 285, 6);
  });

  it("is null when operating cash flow is missing", () => {
    expect(
      freeCashFlow(cash({ netCashProvidedByOperatingActivities: null })),
    ).toBeNull();
  });
});

describe("working capital", () => {
  it("computes the three components", () => {
    expect(dso(income(), balance())).toBeCloseTo((150 / 1000) * 365, 4);
    expect(dio(income(), balance())).toBeCloseTo((100 / 400) * 365, 4);
    expect(dpo(income(), balance())).toBeCloseTo((80 / 400) * 365, 4);
  });

  it("computes the cycle as collection plus inventory less payment", () => {
    const expected =
      (150 / 1000) * 365 + (100 / 400) * 365 - (80 / 400) * 365;
    expect(cashConversionCycle(income(), balance())).toBeCloseTo(expected, 4);
  });

  it("refuses a cycle built from only part of it", () => {
    // A cycle missing payables is a different measure wearing this name.
    expect(
      cashConversionCycle(income(), balance({ accountPayables: null })),
    ).toBeNull();
  });
});

describe("CAGR — refuses meaningless compounds", () => {
  it("computes over the interval", () => {
    // 100 → 200 over 2 years ≈ 41.42%
    expect(cagr(200, 100, 2)).toBeCloseTo(0.414213, 5);
  });

  it("refuses a negative or zero base", () => {
    // Growth from a loss to a profit is a sign change, not a rate.
    expect(cagr(200, -50, 3)).toBeNull();
    expect(cagr(200, 0, 3)).toBeNull();
  });

  it("refuses a negative endpoint", () => {
    expect(cagr(-50, 200, 3)).toBeNull();
  });

  it("refuses a zero interval", () => {
    expect(cagr(200, 100, 0)).toBeNull();
  });

  it("works across a newest-first series", () => {
    // Provider order: newest first. 4 periods = 3 years of compounding.
    expect(seriesCagr([200, 170, 140, 100])).toBeCloseTo(
      Math.pow(2, 1 / 3) - 1,
      5,
    );
  });

  it("refuses a single-period series", () => {
    expect(seriesCagr([200])).toBeNull();
  });
});

describe("share count", () => {
  it("reports dilution as positive", () => {
    const periods = [
      income({ weightedAverageShsOutDil: 110 }),
      income({ weightedAverageShsOutDil: 100 }),
    ];
    expect(shareCountChange(periods)).toBeCloseTo(0.1, 6);
  });

  it("reports buybacks as negative", () => {
    const periods = [
      income({ weightedAverageShsOutDil: 90 }),
      income({ weightedAverageShsOutDil: 100 }),
    ];
    expect(shareCountChange(periods)).toBeCloseTo(-0.1, 6);
  });
});
