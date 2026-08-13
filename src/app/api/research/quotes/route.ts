import { NextResponse } from "next/server";
import { getQuotes, UpstreamError } from "@/lib/research/yahoo";
import { toMarket, toSecurityType } from "@/lib/research/schema";

/**
 * Quotes for an arbitrary set of symbols.
 *
 * The screener route prices a fixed population; this prices whatever the
 * reader has chosen to watch, which is not knowable in advance. One
 * batch request covers the whole watchlist.
 *
 * A symbol the feed does not return is reported as unquoted rather than
 * dropped — a watchlist that silently loses a row is worse than one that
 * shows the row with its figures unavailable.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = (searchParams.get("symbols") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 200);

  if (!symbols.length) {
    return NextResponse.json({ rows: [], asOf: new Date().toISOString() });
  }

  try {
    const quotes = await getQuotes(symbols);
    const bySymbol = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));

    const rows = symbols.map((symbol) => {
      const q = bySymbol.get(symbol.toUpperCase());
      return {
        symbol,
        name: q?.name ?? null,
        market: toMarket(q?.exchange ?? null, symbol),
        securityType: toSecurityType(q?.quoteType),
        currency: q?.currency ?? null,
        price: q?.price ?? null,
        changePercent: q?.changePercent ?? null,
        marketCap: q?.marketCap ?? null,
        trailingPE: q?.trailingPE ?? null,
        priceToBook: q?.priceToBook ?? null,
        dividendYield: q?.dividendYield ?? null,
        fiftyTwoWeekLow: q?.fiftyTwoWeekLow ?? null,
        fiftyTwoWeekHigh: q?.fiftyTwoWeekHigh ?? null,
        quoted: Boolean(q),
      };
    });

    return NextResponse.json({
      rows,
      asOf: new Date().toISOString(),
      delayMinutes:
        quotes.find((q) => q.delayMinutes !== null)?.delayMinutes ?? null,
    });
  } catch (e) {
    const status = e instanceof UpstreamError ? e.status : 500;
    return NextResponse.json(
      {
        error:
          "Market data is unavailable right now. No figures are shown rather than stale ones.",
      },
      { status },
    );
  }
}
