import { describe, expect, it } from "vitest";
import { conversionNote, convert, convertible, pairSymbol } from "./fx";

const rate = {
  from: "USD",
  to: "AUD",
  rate: 1.4134,
  quotedAt: "2026-08-19T04:21:00.000Z",
};

describe("what a live rate may be applied to", () => {
  it("allows live quote figures", () => {
    for (const f of ["price", "marketCap", "fiftyTwoWeekHigh", "navPrice"]) {
      expect(convertible(f), f).toBe(true);
    }
  });

  it("refuses historical statement lines", () => {
    // Today's rate on a revenue line reported three years ago produces
    // a number that was never true in any currency. The company did not
    // earn it, and no rate in history would have made it so.
    for (const f of ["totalRevenue", "netIncome", "operatingCashFlow", "ebitda"]) {
      expect(convertible(f), f).toBe(false);
    }
  });

  it("refuses anything not explicitly listed", () => {
    // An allow-list, so a field added later is not convertible until
    // someone decides it is — failing toward the native currency rather
    // than toward a wrong number.
    expect(convertible("somethingNew")).toBe(false);
  });
});

describe("conversion", () => {
  it("applies the rate", () => {
    expect(convert(100, rate)).toBeCloseTo(141.34, 6);
  });

  it("keeps a missing figure missing rather than making it zero", () => {
    expect(convert(null, rate)).toBeNull();
  });

  it("returns null when there is no rate, rather than the raw figure", () => {
    // Passing the unconverted number through would show a USD figure
    // under an AUD label, which is worse than showing nothing.
    expect(convert(100, null)).toBeNull();
  });

  it("refuses a non-finite rate", () => {
    expect(convert(100, { ...rate, rate: NaN })).toBeNull();
  });
});

describe("pair selection", () => {
  it("builds the provider's own pair symbol", () => {
    expect(pairSymbol("USD", "AUD")).toBe("USDAUD=X");
    expect(pairSymbol("aud", "usd")).toBe("AUDUSD=X");
  });

  it("returns null when the currencies match", () => {
    expect(pairSymbol("AUD", "AUD")).toBeNull();
  });

  it("returns null for anything that is not a currency code", () => {
    expect(pairSymbol("", "AUD")).toBeNull();
    expect(pairSymbol("DOLLARS", "AUD")).toBeNull();
  });
});

describe("the note beside a converted figure", () => {
  it("names the source currency, the rate and when it was quoted", () => {
    // A conversion is only as current as the rate behind it, so the
    // rate's own timestamp travels with it rather than the moment the
    // arithmetic ran.
    const n = conversionNote(rate);
    expect(n).toContain("USD");
    expect(n).toContain("1.4134");
    expect(n).toContain("2026-08-19 04:21");
  });
});
