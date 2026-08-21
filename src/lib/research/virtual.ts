/**
 * Window a long list down to the rows actually on screen.
 *
 * ── WHY NOT A LIBRARY ───────────────────────────────────────────────
 * The row heights here are uniform and the list is one column. That is
 * the case a fixed-height virtualiser solves in about forty lines, and
 * the alternative is a dependency whose measurement, dynamic-height and
 * horizontal-window code this screener will never call. The bundle is
 * already the thing being trimmed.
 *
 * ── WHY NOT KEEP PAGINATING ─────────────────────────────────────────
 * Pagination was a workaround for the same problem: 703 constituents at
 * seven columns puts ~5,000 cells in the DOM and every keystroke in the
 * search box re-reconciles all of them. But paging also hides the size
 * of the result — a reader filtering to 300 companies sees fifty and a
 * page control, and has to do arithmetic to know what they have. A
 * windowed list shows the whole result and renders a screenful.
 *
 * ── THE OVERSCAN IS NOT DECORATION ──────────────────────────────────
 * Rendering exactly the visible rows means a fast scroll paints blank
 * space before React catches up. A few rows above and below absorb
 * that, at the cost of a few more nodes than strictly needed.
 */

export interface VirtualRange {
  /** First index to render. */
  start: number;
  /** One past the last index to render. */
  end: number;
  /** Pixels of spacer above the rendered rows. */
  paddingTop: number;
  /** Pixels of spacer below them. */
  paddingBottom: number;
  /** Full height of the list, so the scrollbar is honest. */
  totalHeight: number;
}

export interface VirtualInput {
  /** Rows in the full, filtered list. */
  count: number;
  /** Uniform row height in pixels. */
  rowHeight: number;
  /** Height of the scrolling viewport. */
  viewportHeight: number;
  /** Current scroll offset within the list. */
  scrollTop: number;
  /** Extra rows rendered beyond the viewport, each side. */
  overscan?: number;
}

/**
 * Which slice of a uniform-height list to render.
 *
 * Pure arithmetic and therefore testable without a DOM, which is the
 * reason it lives here rather than inside the component: an off-by-one
 * in a virtualiser shows up as a row that cannot be reached by
 * scrolling, and that is a bug worth catching in a unit test rather
 * than by eye.
 */
export function virtualRange({
  count,
  rowHeight,
  viewportHeight,
  scrollTop,
  overscan = 6,
}: VirtualInput): VirtualRange {
  const totalHeight = count * rowHeight;

  // A viewport of zero happens on the first render, before layout.
  // Returning an empty window there would flash a blank list, so the
  // first screenful is rendered instead and corrected on measure.
  const effective = viewportHeight > 0 ? viewportHeight : rowHeight * 20;

  const first = Math.floor(Math.max(0, scrollTop) / rowHeight);
  const visible = Math.ceil(effective / rowHeight);

  const end = Math.min(count, first + visible + overscan);
  // Clamped against `end`, not just against zero.
  //
  // A filter that shrinks the list while the reader is scrolled down
  // leaves scrollTop pointing past the new end: with five rows left and
  // a scrollTop of 20,000, `first` is 500 and start would be 494 while
  // end is 5. The slice is then empty and the list renders blank —
  // which reads as "no matches" for a filter that in fact matched five
  // companies. Found by the unit test, not by eye.
  const start = Math.max(0, Math.min(first - overscan, end - 1, count - 1));

  return {
    start,
    end,
    paddingTop: start * rowHeight,
    // Never negative: a scrollTop past the end of a shrinking list
    // would otherwise produce a negative spacer and collapse the
    // scroll height under the reader.
    paddingBottom: Math.max(0, totalHeight - end * rowHeight),
    totalHeight,
  };
}
