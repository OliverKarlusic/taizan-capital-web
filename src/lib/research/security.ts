import {
  SecurityType,
  toMarket,
  toSecurityType,
  type SecurityRef,
} from "./schema";

/**
 * The security master: resolving any listed security the provider covers.
 *
 * ── WHY THIS REPLACED A CONSTITUENT LIST ────────────────────────────
 * The screener's universe was 703 index constituents, and before that 58
 * hand-typed symbols. Both were restrictions this application imposed,
 * not limits of the data: testing the provider directly resolved every
 * symbol asked of it — US mega caps, US small caps, ASX large caps, ASX
 * micro caps down to a A$24m company, and US and ASX ETFs. Coverage was
 * 29 of 29.
 *
 * So the universe is no longer a list. It is whatever the provider can
 * resolve, reached through search. An index list still has a job — it
 * gives the screener a population to rank and filter, which search
 * cannot — but it is no longer the boundary of what can be researched.
 *
 * ── WHAT SEARCH RETURNS THAT WE DO NOT WANT ─────────────────────────
 * A query for "nvidia" comes back with the Nasdaq line, a 2x leveraged
 * ETP in Amsterdam, an XETRA listing, and a tokenised crypto claim on
 * the shares. A query for "commonwealth bank" returns the ASX ordinary,
 * four hybrid/preference lines, a Frankfurt listing and a Cboe Australia
 * duplicate of the same security.
 *
 * None of that is wrong, and none of it belongs in a research terminal
 * for a firm that invests in ASX, NYSE and Nasdaq listed equities and
 * their ETFs. The filtering below is stated rather than silent, and the
 * API route reports what it removed.
 */

/** Venues the terminal covers. Everything else is filtered out. */
const COVERED_EXCHANGES = [
  "asx",
  "australian",
  "nasdaq",
  "nyse",
  "nysearca",
  "nyse arca",
  "bats",
  "cboe bzx",
  "batsetf",
];

/**
 * Cboe Australia carries duplicate listings of ASX securities under .XA
 * and .XC suffixes. They are the same company on a secondary venue with
 * thinner volume, and showing both makes every ASX search look like it
 * found two companies. The primary .AX line is kept.
 */
const SECONDARY_VENUE = /\.(XA|XC)$/i;

/** Only these are researchable here. Crypto, futures and options are not. */
const RESEARCHABLE: SecurityType[] = ["equity", "etf"];

export interface SearchResult extends SecurityRef {
  /** Provider's own relevance ordering is preserved. */
  rank: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  /** Counts of what was filtered and why, so the omission is not silent. */
  filtered: {
    offMarket: number;
    secondaryVenue: number;
    nonResearchableType: number;
  };
  retrievedAt: string;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

interface RawQuote {
  symbol?: unknown;
  shortname?: unknown;
  longname?: unknown;
  quoteType?: unknown;
  exchange?: unknown;
  exchDisp?: unknown;
}

const covered = (exchange: string) =>
  COVERED_EXCHANGES.some((e) => exchange.toLowerCase().includes(e));

/**
 * Resolve a free-text query to securities.
 *
 * Fuzzy matching is disabled: a research tool that quietly answers a
 * different question than the one asked is worse than one that returns
 * nothing. A typo should produce no results, not a confident match on a
 * company the user has never heard of.
 */
export async function searchSecurities(
  query: string,
  limit = 12,
): Promise<SearchResponse> {
  const retrievedAt = new Date().toISOString();
  const q = query.trim();
  if (!q) {
    return {
      query: q,
      results: [],
      filtered: { offMarket: 0, secondaryVenue: 0, nonResearchableType: 0 },
      retrievedAt,
    };
  }

  const r = await fetch(
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      q,
    )}&quotesCount=${Math.min(limit * 3, 30)}&newsCount=0&enableFuzzyQuery=false`,
    { headers: { "User-Agent": UA } },
  );
  if (!r.ok) throw new Error(`Search returned ${r.status}`);

  const j = (await r.json()) as { quotes?: RawQuote[] };
  const filtered = { offMarket: 0, secondaryVenue: 0, nonResearchableType: 0 };
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const [i, raw] of (j.quotes ?? []).entries()) {
    const symbol = typeof raw.symbol === "string" ? raw.symbol : null;
    if (!symbol) continue;

    const securityType = toSecurityType(raw.quoteType);
    if (!RESEARCHABLE.includes(securityType)) {
      filtered.nonResearchableType++;
      continue;
    }
    if (SECONDARY_VENUE.test(symbol)) {
      filtered.secondaryVenue++;
      continue;
    }
    const exchange =
      (typeof raw.exchDisp === "string" && raw.exchDisp) ||
      (typeof raw.exchange === "string" && raw.exchange) ||
      "";
    if (!covered(exchange)) {
      filtered.offMarket++;
      continue;
    }
    if (seen.has(symbol)) continue;
    seen.add(symbol);

    results.push({
      symbol,
      name:
        (typeof raw.longname === "string" && raw.longname) ||
        (typeof raw.shortname === "string" && raw.shortname) ||
        null,
      exchange: exchange || null,
      market: toMarket(exchange, symbol),
      securityType,
      currency: null, // the search payload does not carry it; the quote does
      rank: i,
    });
    if (results.length >= limit) break;
  }

  return { query: q, results, filtered, retrievedAt };
}

/**
 * Which research sections apply to a security type.
 *
 * An ETF has no cost of revenue, no return on equity and no insider
 * register. Rendering those as "unavailable" would imply the figures
 * exist and could not be fetched, when in fact the question does not
 * apply. The terminal asks this before deciding what to show.
 */
export function applicableSections(type: SecurityType): {
  financials: boolean;
  ownership: boolean;
  holdings: boolean;
  valuationMultiples: boolean;
  peers: boolean;
} {
  switch (type) {
    case "equity":
      return {
        financials: true,
        ownership: true,
        holdings: false,
        valuationMultiples: true,
        peers: true,
      };
    case "etf":
      return {
        financials: false,
        ownership: false,
        holdings: true,
        valuationMultiples: true, // aggregate P/E and P/B are published
        peers: true,
      };
    default:
      return {
        financials: false,
        ownership: false,
        holdings: false,
        valuationMultiples: false,
        peers: false,
      };
  }
}
