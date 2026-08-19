import { describe, expect, it } from "vitest";
import { EXCHANGES, exchangeFor, marketSession } from "./session";

/**
 * The holiday rules are asserted against dates whose weekday can be
 * checked independently, so a wrong rule fails here rather than
 * silently mislabelling a real trading session as a closure.
 */

const dow = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });

describe("holiday rules produce the right weekday", () => {
  const us2026 = EXCHANGES.US.holidays(2026);
  const asx2026 = EXCHANGES.ASX.holidays(2026);

  it("puts every US Monday holiday on a Monday", () => {
    // MLK, Washington's Birthday, Memorial Day and Labor Day are all
    // defined as Mondays by rule.
    const mondays = [...us2026].filter((d) =>
      ["01", "02", "05", "09"].includes(d.slice(5, 7)),
    );
    for (const d of mondays) {
      if (d.endsWith("-01-01")) continue; // New Year is a fixed date
      expect(dow(d), d).toBe("Monday");
    }
  });

  it("puts Thanksgiving on a Thursday", () => {
    const nov = [...us2026].find((d) => d.startsWith("2026-11"));
    expect(nov).toBeDefined();
    expect(dow(nov!)).toBe("Thursday");
  });

  it("puts Good Friday on a Friday, in both calendars", () => {
    const usFri = [...us2026].filter((d) => dow(d) === "Friday");
    expect(usFri.length).toBeGreaterThan(0);
    // Easter 2026 is 5 April, so Good Friday is 3 April.
    expect(us2026.has("2026-04-03")).toBe(true);
    expect(asx2026.has("2026-04-03")).toBe(true);
    expect(asx2026.has("2026-04-06")).toBe(true); // Easter Monday
  });

  it("never lands a holiday on a weekend after observation", () => {
    for (const d of us2026) {
      expect(["Saturday", "Sunday"], `${d} is a ${dow(d)}`).not.toContain(dow(d));
    }
  });

  it("keeps Christmas and Boxing Day as two separate ASX closures", () => {
    // Rolling each independently would collide them onto one weekday
    // and quietly lose a day the exchange is shut.
    for (const y of [2025, 2026, 2027, 2028, 2029, 2030]) {
      const h = EXCHANGES.ASX.holidays(y);
      const dec = [...h].filter((d) => d.startsWith(`${y}-12`));
      expect(new Set(dec).size, `${y}: ${dec.join(",")}`).toBe(2);
    }
  });

  it("does not roll Anzac Day, which the ASX observes on the date", () => {
    expect(EXCHANGES.ASX.holidays(2026).has("2026-04-25")).toBe(true);
  });
});

describe("session state", () => {
  const at = (isoUtc: string) => new Date(isoUtc);

  it("is open during ASX trading hours on a weekday", () => {
    // 2026-08-19 is a Wednesday. 02:00Z = 12:00 AEST.
    expect(marketSession("CBA.AX", at("2026-08-19T02:00:00Z"))?.state).toBe(
      "open",
    );
  });

  it("is closed on a weekend, not merely delayed", () => {
    // 2026-08-22 is a Saturday. This is the case the label exists for:
    // a Sunday price is Friday's close, not a twenty-minute delay.
    const s = marketSession("CBA.AX", at("2026-08-22T02:00:00Z"));
    expect(s?.state).toBe("closed");
    expect(s?.label).toContain("last completed session");
  });

  it("distinguishes pre-market from open for a US listing", () => {
    // 12:00Z = 08:00 New York, before the 09:30 open.
    expect(marketSession("AAPL", at("2026-08-19T12:00:00Z"))?.state).toBe("pre");
    // 15:00Z = 11:00 New York.
    expect(marketSession("AAPL", at("2026-08-19T15:00:00Z"))?.state).toBe("open");
    // 21:00Z = 17:00 New York, after the close, inside post.
    expect(marketSession("AAPL", at("2026-08-19T21:00:00Z"))?.state).toBe("post");
  });

  it("reports a holiday distinctly from an ordinary closure", () => {
    // Christmas 2026 falls on a Friday.
    const s = marketSession("AAPL", at("2026-12-25T15:00:00Z"));
    expect(s?.state).toBe("holiday");
    expect(s?.label).toContain("holiday");
  });

  it("resolves the calendar from the symbol", () => {
    expect(exchangeFor("BHP.AX")).toBe("ASX");
    expect(exchangeFor("NVDA")).toBe("US");
    // No calendar configured beats a wrong calendar.
    expect(exchangeFor("0700.HK")).toBeNull();
    expect(exchangeFor("^AXJO")).toBeNull();
    expect(marketSession("0700.HK")).toBeNull();
  });
});
