import { NextResponse } from "next/server";
import {
  getCompany,
  getFund,
  getHistory,
  getQuotes,
  UpstreamError,
  type Fund,
} from "@/lib/research/yahoo";
import { getUniverse, heldIn } from "@/lib/research/constituents";
import {
  maxDrawdown,
  periodReturn,
  rangePosition,
  realisedVolatility,
  sectorMedian,
  type PeerContext,
} from "@/lib/research/metrics";

/**
 * One company's live research payload.
 *
 * ── PEER CONTEXT IS COMPUTED, NOT LOOKED UP ─────────────────────────
 * The sector medians returned here are calculated from this terminal's
 * own covered universe at request time. There is no stored table of
 * "sector averages" anywhere in this repository, because a stored one
 * would go stale silently and nobody would notice.
 *
 * ── WHAT IS ABSENT IS ABSENT ────────────────────────────────────────
 * No cash-flow statement, ownership register, filing list, peer set or
 * earnings calendar is assembled here, because the free upstream does not
 * carry them for both markets in a form worth publishing. The company
 * page renders those tabs as unavailable. Nothing is approximated to fill
 * the space.
 */

export const dynamic = "force-dynamic";

export interface CompanyPayload {
  symbol: string;
  market: string;
  heldIn: string | null;
  quote: Awaited<ReturnType<typeof getCompany>> extends infer C
    ? C extends { quote: infer Q }
      ? Q
      : never
    : never;
  profile: NonNullable<Awaited<ReturnType<typeof getCompany>>>["profile"];
  fundamentals: NonNullable<Awaited<ReturnType<typeof getCompany>>>["fundamentals"];
  risk: {
    beta: number | null;
    volatility1y: number | null;
    maxDrawdown1y: number | null;
    priceReturn1y: number | null;
    rangePosition: number | null;
    observations: number;
  };
  peers: {
    sector: string | null;
    trailingPE: PeerContext;
    priceToBook: PeerContext;
    enterpriseToEbitda: PeerContext;
    dividendYield: PeerContext;
  };
  history: { t: number; c: number }[];
  /**
   * How many closes the provider actually returned, before thinning.
   *
   * The chart caption used to print the *plotted* count and call them
   * "observed closes", which understated a year of trading as 84
   * sessions. The plotted count is a rendering decision; the observed
   * count is a fact about the data, and the caption is making a claim
   * about the data.
   */
  historyObservations: number;
  /** IANA zone of the listing exchange, for session dates. */
  exchangeTimezone: string | null;
  /** Fund-level data. Null for anything that is not a fund. */
  fund: Fund | null;
}

/**
 * Reduce a series to at most `max` points, keeping both endpoints.
 *
 * Keeping the last point is the whole reason this is not a one-line
 * modulo filter — see the note at the call site.
 */
function thin(
  history: { timestamps: number[]; closes: number[] } | null,
  max: number,
): { t: number; c: number }[] {
  const all = (history?.closes ?? []).map((c, i) => ({
    t: history!.timestamps[i],
    c,
  }));
  if (all.length <= max) return all;
  const step = Math.ceil(all.length / max);
  const out = all.filter((_, i) => i % step === 0);
  const last = all[all.length - 1];
  if (out[out.length - 1].t !== last.t) out.push(last);
  return out;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const symbol = decodeURIComponent(ticker).toUpperCase();

  try {
    const company = await getCompany(symbol);
    if (!company) {
      // Any real ticker resolves here, whether or not it is in the
      // screener's index coverage — the lookup goes to the feed, not to
      // the universe. A symbol the feed does not recognise returns this,
      // and the page says so plainly. Nothing is guessed and no nearest
      // match is offered, because a research tool that silently answers a
      // different question than the one asked is worse than one that
      // admits it does not know.
      return NextResponse.json(
        {
          error: `No listing found for "${symbol}". Check the ticker — Australian listings need the .AX suffix, for example BHP.AX.`,
          notFound: true,
        },
        { status: 404 },
      );
    }

    // Fund data only for funds. Asking for it on an operating company
    // returns an empty fundProfile, and an empty section is worse than
    // an absent one — it implies the fund facts exist and could not be
    // fetched, which is the error this terminal keeps making.
    const isFund = ["ETF", "MUTUALFUND", "MONEYMARKET"].includes(
      (company.quote.quoteType ?? "").toUpperCase(),
    );
    const fund: Fund | null = isFund ? await getFund(symbol) : null;

    const history = await getHistory(symbol, "1y");

    /* Peer context, from the covered universe in the same sector. */
    const sector = company.profile.sector;
    let peers: CompanyPayload["peers"] = {
      sector,
      trailingPE: { value: null, count: 0 },
      priceToBook: { value: null, count: 0 },
      enterpriseToEbitda: { value: null, count: 0 },
      dividendYield: { value: null, count: 0 },
    };

    if (sector) {
      // Sector comes from the index publisher for constituents, and from
      // the quote feed for this company. The two vocabularies differ —
      // GICS says "Information Technology" where Yahoo says "Technology" —
      // so match on a normalised form rather than on equality, and fall
      // back to no peer set rather than a wrong one.
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
      const target = norm(sector);
      const universe = await getUniverse();
      const sameSector = universe.constituents
        .filter((c) => {
          if (c.symbol === symbol || !c.sector) return false;
          const a = norm(c.sector);
          return a === target || a.includes(target) || target.includes(a);
        })
        .map((c) => c.symbol)
        // A median needs enough companies to mean something, not all 90
        // in a sector — this caps the request cost of a page view.
        .slice(0, 60);

      if (sameSector.length) {
        const quotes = await getQuotes(sameSector);
        peers = {
          sector,
          trailingPE: sectorMedian(quotes.map((q) => q.trailingPE)),
          priceToBook: sectorMedian(quotes.map((q) => q.priceToBook)),
          // EV/EBITDA is not in the batch quote payload, so there is no
          // peer median for it without one request per peer. Rather than
          // fan out dozens of calls on every page view, it is reported as
          // unavailable — an absent comparison is cheaper than a slow page
          // and far cheaper than a guessed one.
          enterpriseToEbitda: { value: null, count: 0 },
          dividendYield: sectorMedian(quotes.map((q) => q.dividendYield)),
        };
      }
    }

    const payload: CompanyPayload = {
      symbol,
      // Read from the listing itself, so a ticker outside the screener's
      // index coverage still reports its real exchange rather than a dash.
      market: company.quote.exchange ?? (symbol.endsWith(".AX") ? "ASX" : "—"),
      heldIn: heldIn(symbol),
      quote: company.quote as CompanyPayload["quote"],
      profile: company.profile,
      fundamentals: company.fundamentals,
      risk: {
        beta: company.fundamentals.beta,
        volatility1y: realisedVolatility(history),
        maxDrawdown1y: maxDrawdown(history),
        priceReturn1y: periodReturn(history),
        rangePosition: rangePosition(
          company.quote.price,
          company.quote.fiftyTwoWeekLow,
          company.quote.fiftyTwoWeekHigh,
        ),
        observations: history?.closes.length ?? 0,
      },
      peers,
      // Thinned for transport; the shape of a year needs ~120 points, not
      // 250, and this payload is fetched on every company page view.
      //
      // The last observation is kept unconditionally. A plain modulo
      // filter keeps index 0 and every nth after it, which lands on the
      // final close only when the length happens to divide — so most of
      // the time the chart ended days short of the most recent session.
      // That is not merely a cosmetic truncation: the period return
      // printed beside the chart is computed from the plotted endpoints,
      // so a dropped final point published a percentage that did not
      // describe the twelve months it claimed to.
      history: thin(history, 120),
      historyObservations: history?.closes.length ?? 0,
      exchangeTimezone: history?.exchangeTimezone ?? null,
      fund,
    };

    return NextResponse.json(payload);
  } catch (e) {
    const status = e instanceof UpstreamError ? e.status : 500;
    return NextResponse.json(
      {
        error: `Market data for ${symbol} is unavailable right now. No figures are shown rather than stale or estimated ones.`,
      },
      { status },
    );
  }
}
