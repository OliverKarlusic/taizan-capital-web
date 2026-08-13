import { describe, expect, it } from "vitest";
import {
  BareNumber,
  IncomePeriodSchema,
  WrappedNumber,
  toMarket,
  toSecurityType,
} from "./schema";

/**
 * The data-quality invariants, asserted against real provider shapes.
 *
 * The payloads below are copied verbatim from live responses. The
 * NVIDIA one is the exact shape that produced the bug this suite exists
 * to prevent: an income statement reporting $215.9bn of revenue
 * alongside a cost of revenue, gross profit and EBIT of "zero", each of
 * which was a stripped field rather than a figure the company reported.
 */

describe("WrappedNumber — the placeholder-zero discriminator", () => {
  it("reads a genuine figure", () => {
    expect(
      WrappedNumber.parse({ raw: 215938000000, fmt: "215.94B" }),
    ).toBe(215938000000);
  });

  it("rejects the provider's stripped-field marker", () => {
    // {raw: 0, fmt: null} is how the provider marks a field it emptied.
    expect(WrappedNumber.parse({ raw: 0, fmt: null, longFmt: "0" })).toBeNull();
  });

  it("keeps a zero that the company actually reported", () => {
    // A non-dividend payer's payout ratio is a real zero, and the
    // provider formats it. Nulling this would be its own lie.
    expect(WrappedNumber.parse({ raw: 0, fmt: "0.00%" })).toBe(0);
  });

  it("treats an empty wrapper as absent", () => {
    expect(WrappedNumber.parse({})).toBeNull();
  });

  it("treats a missing wrapper as absent", () => {
    expect(WrappedNumber.parse(null)).toBeNull();
    expect(WrappedNumber.parse(undefined)).toBeNull();
  });

  it("passes a non-zero value through regardless of fmt", () => {
    expect(WrappedNumber.parse({ raw: 12.5, fmt: null })).toBe(12.5);
  });

  it("rejects non-finite numbers", () => {
    expect(WrappedNumber.parse({ raw: Number.NaN, fmt: "x" })).toBeNull();
    expect(WrappedNumber.parse({ raw: Number.POSITIVE_INFINITY })).toBeNull();
  });
});

describe("BareNumber — the batch-quote convention", () => {
  it("reads a number", () => {
    expect(BareNumber.parse(217.5)).toBe(217.5);
  });

  it("treats an absent field as null, never zero", () => {
    expect(BareNumber.parse(undefined)).toBeNull();
    expect(BareNumber.parse(null)).toBeNull();
  });

  it("does not coerce a numeric string", () => {
    // "0" arriving as a string would become 0 under Number(), which is
    // exactly the class of silent coercion this codebase forbids.
    expect(BareNumber.parse("0")).toBeNull();
  });

  it("keeps a real zero", () => {
    expect(BareNumber.parse(0)).toBe(0);
  });
});

describe("IncomePeriodSchema — the NVIDIA regression", () => {
  /** Verbatim from quoteSummary for NVDA, period ending 2026-01-31. */
  const NVDA_FY2026 = {
    maxAge: 1,
    endDate: { raw: 1769817600, fmt: "2026-01-31" },
    totalRevenue: { raw: 215938000000, fmt: "215.94B", longFmt: "215,938,000,000" },
    costOfRevenue: { raw: 0, fmt: null, longFmt: "0" },
    grossProfit: { raw: 0, fmt: null, longFmt: "0" },
    researchDevelopment: {},
    sellingGeneralAdministrative: {},
    totalOperatingExpenses: { raw: 0, fmt: null, longFmt: "0" },
    operatingIncome: {},
    ebit: { raw: 0, fmt: null, longFmt: "0" },
    interestExpense: {},
    incomeBeforeTax: {},
    incomeTaxExpense: { raw: 0, fmt: null, longFmt: "0" },
    netIncome: { raw: 120067000000, fmt: "120.07B", longFmt: "120,067,000,000" },
  };

  const parsed = IncomePeriodSchema.parse(NVDA_FY2026);

  it("keeps the figures the provider actually reported", () => {
    expect(parsed.endDate).toBe("2026-01-31");
    expect(parsed.totalRevenue).toBe(215938000000);
    expect(parsed.netIncome).toBe(120067000000);
  });

  it("never reports zero cost of revenue against $215.9bn of sales", () => {
    expect(parsed.costOfRevenue).toBeNull();
    expect(parsed.grossProfit).toBeNull();
    expect(parsed.ebit).toBeNull();
    expect(parsed.totalOperatingExpenses).toBeNull();
    expect(parsed.incomeTaxExpense).toBeNull();
  });

  it("reports absent fields as absent", () => {
    expect(parsed.researchDevelopment).toBeNull();
    expect(parsed.operatingIncome).toBeNull();
    expect(parsed.interestExpense).toBeNull();
  });

  it("has no numeric field that is zero", () => {
    // The invariant in one line: after parsing, a stripped statement
    // contains nulls and real figures, and nothing in between.
    const numeric = Object.entries(parsed).filter(
      ([k]) => k !== "endDate" && k !== "maxAge",
    );
    expect(numeric.filter(([, v]) => v === 0)).toEqual([]);
  });
});

describe("security classification", () => {
  it("distinguishes ETFs from companies", () => {
    expect(toSecurityType("EQUITY")).toBe("equity");
    expect(toSecurityType("ETF")).toBe("etf");
    expect(toSecurityType("etf")).toBe("etf");
  });

  it("does not force an unknown type into equity", () => {
    // Defaulting to "equity" would render a currency pair with a
    // financial-statements tab.
    expect(toSecurityType("FUTURE")).toBe("future");
    expect(toSecurityType("CRYPTOCURRENCY")).toBe("crypto");
    expect(toSecurityType("SOMETHING_NEW")).toBe("unknown");
    expect(toSecurityType(undefined)).toBe("unknown");
  });
});

describe("market derivation", () => {
  it("reads the venue from the exchange, not a hardcoded map", () => {
    expect(toMarket("NasdaqGS", "NVDA")).toBe("Nasdaq");
    expect(toMarket("NYSE", "JPM")).toBe("NYSE");
    expect(toMarket("NYSEArca", "SPY")).toBe("NYSE Arca");
    expect(toMarket("Cboe US", "IEX")).toBe("Cboe");
  });

  it("recognises ASX from the symbol suffix", () => {
    expect(toMarket(null, "BHP.AX")).toBe("ASX");
    expect(toMarket("Australian", "AD8.AX")).toBe("ASX");
  });

  it("passes an unrecognised exchange through rather than guessing", () => {
    expect(toMarket("Tokyo", "7203.T")).toBe("Tokyo");
    expect(toMarket(null, "NVDA")).toBe("—");
  });
});
