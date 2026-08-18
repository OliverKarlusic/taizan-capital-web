import { NextResponse } from "next/server";
import { UpstreamError, getHistory } from "@/lib/research/yahoo";
import { RANGES, isRangeKey } from "@/lib/research/ranges";
import { benchmarkFor } from "@/lib/research/benchmark";

/**
 * One security's price series at one range.
 *
 * ── WHY THIS IS ITS OWN ROUTE ───────────────────────────────────────
 * The company payload carries a twelve-month series so the page has
 * something to draw on first paint. Changing range must not re-fetch
 * the profile, statements, peers and risk metrics alongside it — that
 * is nine tenths of a payload thrown away to redraw one line. This
 * returns the series and nothing else.
 *
 * ── ON RANGES WITH NO DATA ──────────────────────────────────────────
 * A security listed eighteen months ago has no five-year history. The
 * honest answer is an empty series with `available: false`, which the
 * chart renders as a disabled control and a sentence — not an axis
 * drawn over invented points, and not a range silently showing
 * whatever shorter window the provider chose to substitute.
 */

export interface HistoryPayload {
  symbol: string;
  range: string;
  /** Bar size requested from the provider. */
  interval: string;
  /**
   * Median gap between observations, in days — the resolution the
   * series actually has.
   *
   * The provider does not always honour the requested interval. MAX is
   * asked for monthly bars and returns 168 points spanning 1984–2026,
   * which is roughly quarterly: 42 years of months would be about 504.
   * Printing "1mo bars" over that data would claim a resolution the
   * series does not have, so the caption uses this instead and the two
   * are allowed to disagree.
   */
  observedSpacingDays: number | null;
  intraday: boolean;
  /**
   * IANA zone of the listing exchange.
   *
   * Session dates are rendered in it rather than in the reader's zone:
   * Apple's close on the 14th is the 14th in New York whoever is
   * looking, and rendering it in Sydney put it a day ahead of every
   * other source an analyst would check it against.
   */
  exchangeTimezone: string | null;
  points: { t: number; c: number }[];
  /**
   * The index this listing is measured against, over the same window.
   *
   * Its own timestamps are kept rather than being aligned to the
   * security's: two exchanges keep different holidays, so pairing by
   * index would match a Tuesday to a Wednesday, and interpolating the
   * index onto the security's dates would publish levels that were
   * never printed.
   */
  benchmark: {
    symbol: string;
    name: string;
    points: { t: number; c: number }[];
  } | null;
  observations: number;
  available: boolean;
}

/** At most `max` points, both endpoints kept. See the company route. */
function thin(
  h: { timestamps: number[]; closes: number[] } | null,
  max: number,
): { t: number; c: number }[] {
  const all = (h?.closes ?? []).map((c, i) => ({ t: h!.timestamps[i], c }));
  if (all.length <= max) return all;
  const step = Math.ceil(all.length / max);
  const out = all.filter((_, i) => i % step === 0);
  const last = all[all.length - 1];
  if (out[out.length - 1].t !== last.t) out.push(last);
  return out;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const symbol = decodeURIComponent(ticker).toUpperCase();
  const key = new URL(request.url).searchParams.get("range") ?? "1Y";

  if (!isRangeKey(key)) {
    return NextResponse.json(
      { error: `Unknown range "${key}".` },
      { status: 400 },
    );
  }

  const spec = RANGES[key];

  try {
    const bm = benchmarkFor(symbol);
    // Fetched together so the comparison covers the same window. If the
    // index call fails the security still renders — a missing benchmark
    // is a missing comparison, not a broken page.
    const [h, bh] = await Promise.all([
      getHistory(symbol, spec.range, spec.interval),
      bm ? getHistory(bm.symbol, spec.range, spec.interval).catch(() => null) : null,
    ]);

    const bench =
      bm && bh && bh.closes.length > 1
        ? { symbol: bm.symbol, name: bm.name, points: thin(bh, 260) }
        : null;
    // Two points are the minimum that can describe a change; one is a
    // dot the reader would have to interpret as a trend.
    const available = !!h && h.closes.length > 1;

    const points = available ? thin(h, 260) : [];

    // Measured on the full series, not the thinned one. Thinning widens
    // the gaps by design, so measuring after it would describe the
    // drawing rather than the data — 5Y's weekly bars would report as
    // monthly purely because every other point was dropped for
    // transport.
    //
    // Median rather than mean: weekends and holidays make the mean gap
    // longer than any real one, and a single suspension drags it further.
    let observedSpacingDays: number | null = null;
    const ts = h?.timestamps ?? [];
    if (ts.length > 2) {
      const gaps = ts
        .slice(1)
        .map((t, i) => (t - ts[i]) / 86_400)
        .sort((a, b) => a - b);
      observedSpacingDays = gaps[Math.floor(gaps.length / 2)];
    }

    const payload: HistoryPayload = {
      symbol,
      range: key,
      interval: spec.interval,
      observedSpacingDays,
      intraday: spec.intraday,
      exchangeTimezone: h?.exchangeTimezone ?? null,
      points,
      benchmark: bench,
      observations: h?.closes.length ?? 0,
      available,
    };

    return NextResponse.json(payload);
  } catch (e) {
    const status = e instanceof UpstreamError ? e.status : 500;
    return NextResponse.json(
      {
        error: `Price history for ${symbol} is unavailable right now. Nothing is shown rather than stale or estimated figures.`,
      },
      { status },
    );
  }
}
