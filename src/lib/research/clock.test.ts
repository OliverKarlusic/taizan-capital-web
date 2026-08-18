import { describe, expect, it } from "vitest";
import {
  axisMonth,
  isFuture,
  marketDate,
  marketDateTime,
  sessionAxis,
  sessionDate,
  todayInMarket,
} from "./clock";
import { dropFuture } from "./yahoo";

/**
 * These assert the property that matters: the answer does not depend on
 * where the process rendering it is running. Each case picks an instant
 * that falls on a different calendar day in UTC than in Sydney, so a
 * formatter that quietly used the host zone would produce a visibly
 * different string and fail here.
 */

describe("dates resolve in the market's zone, not the host's", () => {
  it("reports the Sydney date when UTC is still on the previous day", () => {
    // 2026-08-15T23:30Z is 2026-08-16 09:30 AEST — the Sunday evening in
    // London is already Monday morning at the exchange.
    expect(marketDate("2026-08-15T23:30:00Z")).toBe("16 Aug 2026");
  });

  it("reports the Sydney date when UTC has already turned over", () => {
    // 2026-08-16T01:00Z is 2026-08-16 11:00 AEST — same day, but only
    // because the offset is applied. A UTC render agrees by luck here.
    expect(marketDate("2026-08-16T01:00:00Z")).toBe("16 Aug 2026");
  });

  it("names the zone on a timestamp so the reader knows which clock", () => {
    const s = marketDateTime("2026-08-15T23:30:00Z");
    expect(s).toContain("16 Aug");
    expect(s).toMatch(/AES?T|AEDT/);
  });

  it("switches the abbreviation across daylight saving on its own", () => {
    // January is AEDT (+11), August is AEST (+10). No table to maintain.
    expect(marketDateTime("2026-01-15T02:00:00Z")).toContain("AEDT");
    expect(marketDateTime("2026-08-15T02:00:00Z")).toContain("AEST");
  });

  it("formats a chart tick from unix seconds", () => {
    expect(axisMonth(Date.UTC(2026, 7, 15) / 1000)).toBe("Aug 2026");
  });

  it("never renders a year that could be read as a day of the month", () => {
    // The reported "future dates" were "Aug 25" and "Aug 26" — August
    // 2025 and August 2026 in two-digit form, read as the 25th and
    // 26th. Any tick whose numeric part falls in 1–31 is ambiguous with
    // a date, so the year is asserted to be four digits across a span
    // that would have produced the misreadable range.
    for (let y = 2020; y <= 2031; y++) {
      const label = axisMonth(Date.UTC(y, 7, 15) / 1000);
      const digits = label.match(/\d+/)?.[0] ?? "";
      expect(digits).toHaveLength(4);
      expect(Number(digits)).toBe(y);
    }
  });

  it("gives the Sydney calendar date as ISO", () => {
    expect(todayInMarket(new Date("2026-08-15T23:30:00Z"))).toBe("2026-08-16");
  });
});

describe("no data point is dated ahead of now", () => {
  const now = Date.UTC(2026, 7, 15, 4, 0, 0); // 14:00 AEST, mid-session
  const sec = (ms: number) => ms / 1000;

  it("keeps sessions that have happened", () => {
    const ts = [
      sec(Date.UTC(2026, 7, 13)),
      sec(Date.UTC(2026, 7, 14)),
    ];
    const out = dropFuture(ts, [10, 11], now);
    expect(out.timestamps).toEqual(ts);
    expect(out.closes).toEqual([10, 11]);
  });

  it("drops a bar stamped after the current instant", () => {
    // The provider returning tomorrow's session with a price on it is the
    // case this exists for: plotting it asserts a close that has not
    // occurred.
    const ts = [sec(Date.UTC(2026, 7, 14)), sec(Date.UTC(2026, 7, 16))];
    const out = dropFuture(ts, [10, 99], now);
    expect(out.timestamps).toEqual([sec(Date.UTC(2026, 7, 14))]);
    expect(out.closes).toEqual([10]);
  });

  it("still drops holiday nulls rather than carrying a close forward", () => {
    const ts = [
      sec(Date.UTC(2026, 7, 12)),
      sec(Date.UTC(2026, 7, 13)),
      sec(Date.UTC(2026, 7, 14)),
    ];
    const out = dropFuture(ts, [10, null, 12], now);
    expect(out.closes).toEqual([10, 12]);
    expect(out.timestamps).toHaveLength(2);
  });

  it("keeps the series aligned when it drops from the middle", () => {
    const ts = [1, 2, 3, 4].map((d) => sec(Date.UTC(2026, 7, 10 + d)));
    const out = dropFuture(ts, [10, null, 12, 13], now);
    // Index i of closes must still describe timestamps[i]; a filter that
    // dropped from one array only would silently shift every date.
    expect(out.timestamps).toEqual([ts[0], ts[2], ts[3]]);
    expect(out.closes).toEqual([10, 12, 13]);
  });

  it("treats the boundary as past, not future", () => {
    expect(isFuture(now / 1000, now)).toBe(false);
    expect(isFuture(now / 1000 + 1, now)).toBe(true);
  });
});

describe("session dates belong to the exchange, not the reader", () => {
  // 2026-08-14 20:00 UTC is the close of the 14th in New York and the
  // morning of the 15th in Sydney. The session is the 14th.
  const close = Date.UTC(2026, 7, 14, 20, 0) / 1000;

  it("renders a US close on its own trading date", () => {
    expect(sessionDate(close, "America/New_York")).toBe("14 Aug 2026");
  });

  it("does not shift it into the reader's zone", () => {
    // What the bug produced: the same bar a day later.
    expect(marketDate(close * 1000)).toBe("15 Aug 2026");
    expect(sessionDate(close, "America/New_York")).not.toBe(
      marketDate(close * 1000),
    );
  });

  it("leaves an ASX session unchanged, since the zones agree", () => {
    const asx = Date.UTC(2026, 7, 14, 6, 0) / 1000; // 16:00 AEST on the 14th
    expect(sessionDate(asx, "Australia/Sydney")).toBe("14 Aug 2026");
  });

  it("falls back to the market zone when the exchange is unknown", () => {
    expect(sessionDate(close, null)).toBe(marketDate(close * 1000));
  });

  it("keeps four-digit years on the axis in any zone", () => {
    for (const tz of ["America/New_York", "Asia/Hong_Kong", null]) {
      expect(sessionAxis(close, tz)).toMatch(/\d{4}$/);
    }
  });
});
