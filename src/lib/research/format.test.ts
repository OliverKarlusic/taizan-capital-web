import { describe, expect, it } from "vitest";
import {
  DASH,
  NOT_MEANINGFUL,
  decimal,
  isNotMeaningful,
  meaningfulRatio,
  multiple,
  percent,
  relativeTo,
  signedPercent,
} from "./format";

describe("multiple — negative ratios are not cheap ratios", () => {
  it("marks a negative earnings multiple as not meaningful", () => {
    // NEXTDC's forward P/E came back as -35.64. Rendered as a number it
    // reads as a figure to compare against a peer's 22x.
    expect(multiple(-35.64)).toBe(NOT_MEANINGFUL);
    expect(multiple(-0.01)).toBe(NOT_MEANINGFUL);
  });

  it("marks a zero multiple as not meaningful", () => {
    expect(multiple(0)).toBe(NOT_MEANINGFUL);
  });

  it("distinguishes not-meaningful from not-supplied", () => {
    // Different statements: one was supplied and cannot be interpreted,
    // the other was never supplied at all.
    expect(multiple(null)).toBe(DASH);
    expect(multiple(-5)).toBe(NOT_MEANINGFUL);
  });

  it("formats a positive multiple normally", () => {
    expect(multiple(33.358894, 1)).toBe("33.4");
    expect(multiple(22.3, 1)).toBe("22.3");
  });
});

describe("meaningfulRatio — keeps negatives out of sorts and filters", () => {
  it("nulls a non-positive ratio", () => {
    expect(meaningfulRatio(-35.64)).toBeNull();
    expect(meaningfulRatio(0)).toBeNull();
  });

  it("passes a positive ratio through", () => {
    expect(meaningfulRatio(18.2)).toBe(18.2);
  });

  it("leaves an absent ratio absent", () => {
    expect(meaningfulRatio(null)).toBeNull();
  });

  it("identifies the not-meaningful case", () => {
    expect(isNotMeaningful(-1)).toBe(true);
    expect(isNotMeaningful(0)).toBe(true);
    expect(isNotMeaningful(5)).toBe(false);
    expect(isNotMeaningful(null)).toBe(false);
  });
});

describe("significance — a real number never renders as zero", () => {
  it("widens precision rather than rounding a small value to nothing", () => {
    // Berkshire's price/book came back as 0.00104. At one decimal it
    // rendered "0.0", indistinguishable from zero or from missing.
    expect(decimal(0.0010355291, 1)).not.toBe("0.0");
    expect(decimal(0.0010355291, 1)).toContain("0.001");
  });

  it("still renders a genuine zero as zero", () => {
    expect(decimal(0, 2)).toBe("0.00");
    expect(percent(0, 2)).toBe("0.00%");
  });

  it("renders missing as an em dash", () => {
    expect(decimal(null)).toBe(DASH);
    expect(percent(null)).toBe(DASH);
    expect(signedPercent(null)).toBe(DASH);
  });

  it("uses a true minus sign, not a hyphen", () => {
    expect(signedPercent(-4.2, 1)).toBe("−4.2%");
    expect(signedPercent(4.2, 1)).toBe("+4.2%");
  });
});

describe("relativeTo — direction only, never a verdict", () => {
  it("returns a direction word", () => {
    expect(relativeTo(50, 100)).toBe("below");
    expect(relativeTo(150, 100)).toBe("above");
    expect(relativeTo(101, 100)).toBe("in line with");
  });

  it("refuses to compare against an absent or zero reference", () => {
    expect(relativeTo(50, null)).toBeNull();
    expect(relativeTo(null, 100)).toBeNull();
    expect(relativeTo(50, 0)).toBeNull();
  });
});
