import { NextResponse } from "next/server";
import {
  getCompany,
  getCompanyDetail,
  getNews,
  getQuotes,
  UpstreamError,
} from "@/lib/research/yahoo";
import { getUniverse } from "@/lib/research/constituents";

/**
 * The heavier half of a company page: statements, ownership, calendar,
 * filings, news and a peer set.
 *
 * ── WHY THIS IS A SECOND ROUTE ──────────────────────────────────────
 * It costs another eight quoteSummary modules plus a news call plus a
 * peer batch quote. Folding that into the main company request would
 * make every page view wait for data most readers never open. It is
 * fetched when one of those tabs is first selected and cached after.
 *
 * ── ON PEERS ────────────────────────────────────────────────────────
 * A peer set needs a defensible basis for membership. This uses the
 * company's own GICS sector as published by the index that lists it, and
 * picks the constituents nearest to it by market capitalisation. Both
 * inputs are stated on the page. It is a sector-and-size cohort drawn
 * from this terminal's coverage, and the page calls it that rather than
 * "comparable companies", which would imply a judgement about
 * comparability that nobody here has made.
 */

export const dynamic = "force-dynamic";

export interface PeerRow {
  symbol: string;
  name: string | null;
  marketCap: number | null;
  trailingPE: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const symbol = decodeURIComponent(ticker).toUpperCase();

  try {
    // The company must resolve before news, which needs its name to judge
    // whether a headline is actually about it.
    const company = await getCompany(symbol);
    const [detail, news] = await Promise.all([
      getCompanyDetail(symbol),
      getNews(symbol, company?.quote.name ?? null),
    ]);

    if (!detail) {
      return NextResponse.json(
        { error: `No detail available for "${symbol}".`, notFound: true },
        { status: 404 },
      );
    }

    /* ── peers: same sector, nearest by size ── */
    let peers: PeerRow[] = [];
    let peerBasis: { sector: string | null; index: string | null } = {
      sector: null,
      index: null,
    };

    const universe = await getUniverse();
    const self = universe.constituents.find((c) => c.symbol === symbol);
    const sector = self?.sector ?? company?.profile.sector ?? null;

    if (sector) {
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
      const target = norm(sector);
      const cohort = universe.constituents.filter((c) => {
        if (c.symbol === symbol || !c.sector) return false;
        const a = norm(c.sector);
        return a === target || a.includes(target) || target.includes(a);
      });

      if (cohort.length) {
        const quotes = await getQuotes(cohort.map((c) => c.symbol).slice(0, 60));
        const own = company?.quote.marketCap ?? null;
        const ranked = quotes
          .filter((q) => q.marketCap !== null)
          .sort((a, b) =>
            own === null
              ? (b.marketCap ?? 0) - (a.marketCap ?? 0)
              : Math.abs((a.marketCap ?? 0) - own) -
                Math.abs((b.marketCap ?? 0) - own),
          )
          .slice(0, 8);

        peers = ranked.map((q) => ({
          symbol: q.symbol,
          name: q.name,
          marketCap: q.marketCap,
          trailingPE: q.trailingPE,
          priceToBook: q.priceToBook,
          dividendYield: q.dividendYield,
        }));
        peerBasis = { sector, index: self?.index ?? null };
      }
    }

    return NextResponse.json({
      ...detail,
      news,
      peers,
      peerBasis,
      currency: company?.quote.currency ?? null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    const status = e instanceof UpstreamError ? e.status : 500;
    return NextResponse.json(
      {
        error: `Additional data for ${symbol} is unavailable right now. Nothing is estimated in its place.`,
      },
      { status },
    );
  }
}
