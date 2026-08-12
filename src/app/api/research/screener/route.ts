import { NextResponse } from "next/server";
import { getQuotes, UpstreamError } from "@/lib/research/yahoo";
import { getUniverse, heldIn } from "@/lib/research/constituents";

/**
 * Screener rows — real index constituents, priced from the delayed feed.
 *
 * ── SECTORS COME FROM THE INDEX, NOT FROM 700 EXTRA REQUESTS ────────
 * Both constituent sources publish a sector alongside each company, so
 * the screener gets sector for free. The previous implementation issued
 * one profile request per symbol to fetch it, which was tolerable at 58
 * symbols and would be about 700 requests now.
 *
 * ── MARKET IS READ, NOT ASSUMED ─────────────────────────────────────
 * Which exchange a line trades on comes from the quote feed's own
 * exchange field rather than from a hardcoded map, so it stays correct
 * as the universe changes and needs no maintenance.
 *
 * ── PARTIAL FAILURE ─────────────────────────────────────────────────
 * A constituent whose quote does not come back is still returned, with
 * null figures, and renders as unavailable. It is not dropped silently
 * and it is not filled in. Losing one line's price must not remove the
 * company from the index.
 */

export const dynamic = "force-dynamic";

export interface ScreenerRow {
  symbol: string;
  name: string | null;
  market: string;
  index: string;
  exchange: string | null;
  currency: string | null;
  quoteType: string | null;
  sector: string | null;
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  heldIn: string | null;
  /** False when the feed returned nothing for this constituent. */
  quoted: boolean;
}

/** Yahoo's exchange names mapped to the facet the screener filters on. */
function marketOf(exchange: string | null, symbol: string): string {
  if (symbol.endsWith(".AX")) return "ASX";
  if (!exchange) return "—";
  const e = exchange.toLowerCase();
  if (e.includes("nasdaq")) return "Nasdaq";
  if (e.includes("nyse")) return "NYSE";
  if (e.includes("asx")) return "ASX";
  return exchange;
}

export async function GET() {
  try {
    const universe = await getUniverse();

    if (!universe.constituents.length) {
      return NextResponse.json(
        {
          error:
            "The index constituent lists could not be loaded, so there is no universe to screen. No substitute list is used.",
          sources: universe.sources,
        },
        { status: 503 },
      );
    }

    const symbols = universe.constituents.map((c) => c.symbol);
    const quotes = await getQuotes(symbols);
    const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));

    const rows: ScreenerRow[] = universe.constituents.map((c) => {
      const q = bySymbol.get(c.symbol);
      return {
        symbol: c.symbol,
        // The index publishes the legal name; the feed publishes the
        // trading name. Prefer the feed's where it exists, since that is
        // what a reader searching will recognise.
        name: q?.name ?? c.name ?? null,
        market: marketOf(q?.exchange ?? null, c.symbol),
        index: c.index,
        exchange: q?.exchange ?? null,
        currency: q?.currency ?? null,
        quoteType: q?.quoteType ?? null,
        sector: c.sector,
        price: q?.price ?? null,
        changePercent: q?.changePercent ?? null,
        marketCap: q?.marketCap ?? null,
        trailingPE: q?.trailingPE ?? null,
        forwardPE: q?.forwardPE ?? null,
        priceToBook: q?.priceToBook ?? null,
        dividendYield: q?.dividendYield ?? null,
        heldIn: heldIn(c.symbol),
        quoted: Boolean(q),
      };
    });

    rows.sort((a, b) => (b.marketCap ?? -1) - (a.marketCap ?? -1));

    const delayed =
      quotes.find((q) => q.delayMinutes !== null)?.delayMinutes ?? null;

    return NextResponse.json({
      rows,
      asOf: new Date().toISOString(),
      delayMinutes: delayed,
      quotedCount: rows.filter((r) => r.quoted).length,
      universe: {
        sources: universe.sources,
        fetchedAt: universe.fetchedAt,
        total: universe.constituents.length,
      },
    });
  } catch (e) {
    const status = e instanceof UpstreamError ? e.status : 500;
    return NextResponse.json(
      {
        error:
          "Market data is unavailable right now. No figures are shown rather than stale or estimated ones.",
      },
      { status },
    );
  }
}
