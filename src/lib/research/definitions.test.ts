import { describe, expect, it } from "vitest";
import { DEFINITIONS, definitionText } from "./definitions";

describe("metric definitions", () => {
  it("returns the sentence, with the caveat appended where there is one", () => {
    const t = definitionText("trailingPE");
    expect(t).toContain("divided by the profit");
    expect(t).toContain("Undefined when a company makes a loss");
  });

  it("is undefined for a key with no entry, so nothing renders", () => {
    expect(definitionText("notAMetric")).toBeUndefined();
  });

  it("never tells the reader whether a value is good", () => {
    // A definition that says "a low P/E may indicate an undervalued
    // company" is a recommendation wearing a definition's clothes, and
    // this terminal does not publish those. The bar is deliberately
    // blunt: these words have no business in a description of what a
    // number measures.
    const banned =
      /\b(should|recommend|undervalued|overvalued|attractive|cheap|expensive|good|bad|strong buy|avoid)\b/i;
    for (const [key, d] of Object.entries(DEFINITIONS)) {
      expect(`${key}: ${d.what}`).not.toMatch(banned);
      if (d.caveat) expect(`${key}: ${d.caveat}`).not.toMatch(banned);
    }
  });

  it("explains the two conventions a reader will otherwise misread", () => {
    // An em dash and "N/M" both look like missing data; only one is.
    expect(definitionText("unavailable")).toContain("Nothing is estimated");
    expect(definitionText("notMeaningful")).toContain("would not mean anything");
  });

  it("covers every metric family the terminal renders", () => {
    for (const k of [
      "marketCap", "trailingPE", "priceToBook", "dividendYield",
      "roic", "netMargin", "currentRatio", "netDebtToEbitda",
      "freeCashFlow", "cashConversionCycle", "beta", "maxDrawdown",
      "expenseRatio", "nav",
    ]) {
      expect(DEFINITIONS[k], `missing definition: ${k}`).toBeDefined();
    }
  });
});
