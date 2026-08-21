import { describe, expect, it } from "vitest";
import { virtualRange } from "./virtual";

const base = { count: 703, rowHeight: 40, viewportHeight: 800, scrollTop: 0 };

describe("virtual window", () => {
  it("renders the first screenful plus overscan at the top", () => {
    const r = virtualRange(base);
    expect(r.start).toBe(0);
    // 800 / 40 = 20 visible, plus 6 overscan below.
    expect(r.end).toBe(26);
    expect(r.paddingTop).toBe(0);
  });

  it("reports the full height so the scrollbar is honest", () => {
    // A scrollbar sized to the rendered rows rather than the list would
    // tell the reader there are 26 companies when there are 703.
    expect(virtualRange(base).totalHeight).toBe(703 * 40);
  });

  it("moves the window as the list scrolls", () => {
    const r = virtualRange({ ...base, scrollTop: 4000 });
    // 4000 / 40 = row 100, less 6 overscan.
    expect(r.start).toBe(94);
    expect(r.paddingTop).toBe(94 * 40);
    expect(r.end).toBe(126);
  });

  it("keeps padding consistent with the window at every offset", () => {
    // The invariant that matters: spacers plus rendered rows always
    // equal the full height. If they drift, the list grows or shrinks
    // under the reader as they scroll.
    for (const scrollTop of [0, 137, 4000, 9999, 28120]) {
      const r = virtualRange({ ...base, scrollTop });
      const rendered = (r.end - r.start) * base.rowHeight;
      expect(r.paddingTop + rendered + r.paddingBottom).toBe(r.totalHeight);
    }
  });

  it("clamps at the end of the list", () => {
    const r = virtualRange({ ...base, scrollTop: 703 * 40 });
    expect(r.end).toBe(703);
    expect(r.paddingBottom).toBe(0);
  });

  it("never produces a negative spacer", () => {
    // Scrolled past the end of a list that just shrank under a filter.
    const r = virtualRange({ ...base, count: 5, scrollTop: 20000 });
    expect(r.paddingBottom).toBeGreaterThanOrEqual(0);
    expect(r.start).toBeLessThanOrEqual(r.end);
  });

  it("renders something before the viewport has been measured", () => {
    // On first paint viewportHeight is 0. An empty window there would
    // flash a blank list.
    const r = virtualRange({ ...base, viewportHeight: 0 });
    expect(r.end).toBeGreaterThan(0);
  });

  it("handles an empty result without dividing by anything", () => {
    const r = virtualRange({ ...base, count: 0 });
    expect(r.start).toBe(0);
    expect(r.end).toBe(0);
    expect(r.totalHeight).toBe(0);
    expect(r.paddingBottom).toBe(0);
  });

  it("reaches every row across a full scroll of the list", () => {
    // The bug this guards: an off-by-one that leaves a row unreachable
    // by scrolling, which is invisible until someone goes looking for
    // a specific company and cannot find it.
    const seen = new Set<number>();
    for (let top = 0; top <= 703 * 40; top += 40) {
      const r = virtualRange({ ...base, scrollTop: top });
      for (let i = r.start; i < r.end; i++) seen.add(i);
    }
    expect(seen.size).toBe(703);
  });
});
