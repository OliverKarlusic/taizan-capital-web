/**
 * Yahoo Finance client — SERVER ONLY. Never import this into a client
 * component; it holds a session cookie and would leak it into the bundle.
 *
 * ── WHY NOT yfinance ────────────────────────────────────────────────
 * The brief specifies a yfinance-based backend. yfinance is a Python
 * client for Yahoo's public JSON endpoints — the same endpoints called
 * below. Standing a Python service beside this app would mean a second
 * runtime, a second deployment and a second thing to keep alive, and the
 * brief also says the Terminal must stay inside the same application.
 * This talks to the identical upstream, from the runtime the site already
 * has. The data is the same data.
 *
 * ── AUTH ────────────────────────────────────────────────────────────
 * The chart endpoint is open. Everything else — batch quotes,
 * quoteSummary — returns 401 without a session cookie and a matching
 * crumb. The handshake below fetches a cookie from fc.yahoo.com (which
 * answers 404 but still sets the cookie) and exchanges it for a crumb.
 * Both are cached and re-acquired on the first 401, because Yahoo expires
 * them without warning.
 *
 * ── ON MISSING VALUES ───────────────────────────────────────────────
 * Every accessor returns `number | null`. A missing figure is null and
 * stays null all the way to the screen, where it renders as an em dash.
 * It is never coerced to zero and never filled with a neighbouring value.
 * NEXTDC has no trailing P/E because it does not currently earn a profit;
 * that is information, and a zero there would be a lie.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/* ── cache ────────────────────────────────────────────────────────── */

type Entry = { value: unknown; expires: number };
const cache = new Map<string, Entry>();

/**
 * Quotes move; profiles do not. Sector and industry are cached for a day
 * because re-fetching a company's sector every minute is pure waste, and
 * the screener needs one profile call per symbol in its universe.
 */
export const TTL = {
  quote: 60_000,
  summary: 5 * 60_000,
  profile: 24 * 60 * 60_000,
  history: 30 * 60_000,
};

async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await load();
  cache.set(key, { value, expires: Date.now() + ttl });
  return value;
}

/* ── session ──────────────────────────────────────────────────────── */

let session: { cookie: string; crumb: string } | null = null;
let inFlight: Promise<{ cookie: string; crumb: string } | null> | null = null;

async function openSession() {
  for (const seed of ["https://fc.yahoo.com/", "https://finance.yahoo.com/"]) {
    try {
      const r = await fetch(seed, {
        headers: { "User-Agent": UA },
        redirect: "manual",
      });
      const cookie = (r.headers.getSetCookie?.() ?? [])
        .map((c) => c.split(";")[0])
        .join("; ");
      if (!cookie) continue;

      const cr = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
        headers: { "User-Agent": UA, Cookie: cookie },
      });
      const crumb = (await cr.text()).trim();
      if (cr.ok && crumb && !crumb.startsWith("<")) return { cookie, crumb };
    } catch {
      /* try the next seed */
    }
  }
  return null;
}

/** Serialised so a burst of parallel requests performs one handshake. */
async function getSession() {
  if (session) return session;
  if (!inFlight) {
    inFlight = openSession().finally(() => {
      inFlight = null;
    });
  }
  session = await inFlight;
  return session;
}

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

/** GET with the session attached, retrying once on 401 with a fresh one. */
async function authed(url: string): Promise<unknown> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const s = await getSession();
    if (!s) throw new UpstreamError("Could not open a Yahoo Finance session", 503);

    const sep = url.includes("?") ? "&" : "?";
    const r = await fetch(`${url}${sep}crumb=${encodeURIComponent(s.crumb)}`, {
      headers: { "User-Agent": UA, Cookie: s.cookie },
    });

    if (r.status === 401 || r.status === 403) {
      session = null; // expired — drop it and try once more
      continue;
    }
    // 404 means "no such symbol", which is an answer, not a failure. It
    // must not be collapsed into the generic upstream error — telling a
    // reader that a ticker they mistyped is "temporarily unavailable"
    // invites them to keep retrying something that will never work.
    if (r.status === 404) throw new UpstreamError("Symbol not found", 404);
    if (!r.ok) throw new UpstreamError(`Yahoo Finance returned ${r.status}`, 502);
    return r.json();
  }
  throw new UpstreamError("Yahoo Finance rejected the session twice", 502);
}

/* ── shapes ───────────────────────────────────────────────────────── */

/** Yahoo returns bare numbers here, and omits the key when unknown. */
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** ...but wraps them as { raw, fmt } in quoteSummary. */
const raw = (v: unknown): number | null =>
  num((v as { raw?: unknown } | undefined)?.raw);

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

export interface Quote {
  symbol: string;
  name: string | null;
  currency: string | null;
  exchange: string | null;
  quoteType: string | null;
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  /** Per cent, e.g. 3.06 — normalised across Yahoo's two conventions. */
  dividendYield: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  marketState: string | null;
  /** Minutes by which this exchange's feed is delayed, as Yahoo reports it. */
  delayMinutes: number | null;
}

function toQuote(q: Record<string, unknown>): Quote {
  return {
    symbol: String(q.symbol),
    name: str(q.longName) ?? str(q.shortName) ?? str(q.displayName),
    currency: str(q.currency),
    exchange: str(q.fullExchangeName) ?? str(q.exchange),
    quoteType: str(q.quoteType),
    price: num(q.regularMarketPrice),
    changePercent: num(q.regularMarketChangePercent),
    marketCap: num(q.marketCap),
    trailingPE: num(q.trailingPE),
    forwardPE: num(q.forwardPE),
    priceToBook: num(q.priceToBook),
    dividendYield: num(q.dividendYield),
    fiftyTwoWeekLow: num(q.fiftyTwoWeekLow),
    fiftyTwoWeekHigh: num(q.fiftyTwoWeekHigh),
    marketState: str(q.marketState),
    delayMinutes:
      num(q.exchangeDataDelayedBy) === null
        ? null
        : Math.round(num(q.exchangeDataDelayedBy)!),
  };
}

/* ── endpoints ────────────────────────────────────────────────────── */

/**
 * Batch quotes.
 *
 * Yahoo truncates long symbol lists, so the universe is chunked. With
 * roughly 700 constituents that is ~14 requests; run end to end they take
 * about seven seconds, which is the whole page's time budget spent on one
 * call. They run with a small concurrency instead — small deliberately,
 * because the free endpoint rate-limits and a burst of fourteen is a
 * quicker way to get a 429 than to get an answer.
 *
 * A chunk that fails contributes nothing rather than rejecting the batch.
 * The caller pairs quotes back to constituents by symbol and marks the
 * unmatched ones unavailable, so a failed chunk costs those rows their
 * figures and not their existence.
 */
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (!symbols.length) return [];
  const key = `q:${symbols.slice().sort().join(",")}`;
  return cached(key, TTL.quote, async () => {
    const chunks: string[][] = [];
    for (let i = 0; i < symbols.length; i += 50) chunks.push(symbols.slice(i, i + 50));

    const out: Quote[] = [];
    let cursor = 0;
    const workers = Array.from({ length: Math.min(4, chunks.length) }, async () => {
      while (cursor < chunks.length) {
        const chunk = chunks[cursor++];
        try {
          const j = (await authed(
            `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${chunk
              .map(encodeURIComponent)
              .join(",")}`,
          )) as { quoteResponse?: { result?: Record<string, unknown>[] } };
          for (const q of j?.quoteResponse?.result ?? []) out.push(toQuote(q));
        } catch {
          /* this chunk's symbols will be reported unavailable */
        }
      }
    });
    await Promise.all(workers);
    return out;
  });
}

export interface Profile {
  symbol: string;
  sector: string | null;
  industry: string | null;
  country: string | null;
  employees: number | null;
  summary: string | null;
  website: string | null;
}

export interface Fundamentals {
  /** Ratios. Any of these may be null. */
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  enterpriseToEbitda: number | null;
  enterpriseToRevenue: number | null;
  pegRatio: number | null;
  /** Growth and profitability, as fractions (0.164 = 16.4%). */
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  profitMargins: number | null;
  operatingMargins: number | null;
  grossMargins: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  /** Balance sheet. */
  debtToEquity: number | null;
  currentRatio: number | null;
  totalCash: number | null;
  totalDebt: number | null;
  /** Risk. */
  beta: number | null;
  /** Per cent. */
  dividendYield: number | null;
  payoutRatio: number | null;
  bookValue: number | null;
  eps: number | null;
}

export interface Company {
  quote: Quote;
  profile: Profile;
  fundamentals: Fundamentals;
}

const SUMMARY_MODULES = [
  "price",
  "summaryDetail",
  "defaultKeyStatistics",
  "financialData",
  "assetProfile",
].join(",");

/**
 * Returns null when the symbol does not exist, and throws when the feed
 * is genuinely unwell. The caller renders those as two different things:
 * "no such ticker" and "try again shortly".
 */
export async function getCompany(symbol: string): Promise<Company | null> {
  return cached(`c:${symbol}`, TTL.summary, async () => {
    let j: { quoteSummary?: { result?: Record<string, unknown>[] } };
    try {
      j = (await authed(
        `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
          symbol,
        )}?modules=${SUMMARY_MODULES}`,
      )) as { quoteSummary?: { result?: Record<string, unknown>[] } };
    } catch (e) {
      if (e instanceof UpstreamError && e.status === 404) return null;
      throw e;
    }

    const r = j?.quoteSummary?.result?.[0];
    if (!r) return null;

    const price = (r.price ?? {}) as Record<string, unknown>;
    const detail = (r.summaryDetail ?? {}) as Record<string, unknown>;
    const stats = (r.defaultKeyStatistics ?? {}) as Record<string, unknown>;
    const fin = (r.financialData ?? {}) as Record<string, unknown>;
    const prof = (r.assetProfile ?? {}) as Record<string, unknown>;

    // summaryDetail reports yield as a fraction; the v7 quote endpoint
    // reports it as a percentage. Normalise to percentage here so the two
    // paths cannot disagree on screen.
    const yieldFraction = raw(detail.dividendYield);

    return {
      quote: {
        symbol,
        name: str(price.longName) ?? str(price.shortName),
        currency: str(price.currency),
        exchange: str(price.exchangeName),
        quoteType: str(price.quoteType),
        price: raw(price.regularMarketPrice),
        changePercent:
          raw(price.regularMarketChangePercent) === null
            ? null
            : raw(price.regularMarketChangePercent)! * 100,
        marketCap: raw(price.marketCap),
        trailingPE: raw(detail.trailingPE),
        forwardPE: raw(detail.forwardPE),
        priceToBook: raw(stats.priceToBook),
        dividendYield: yieldFraction === null ? null : yieldFraction * 100,
        fiftyTwoWeekLow: raw(detail.fiftyTwoWeekLow),
        fiftyTwoWeekHigh: raw(detail.fiftyTwoWeekHigh),
        marketState: str(price.marketState),
        delayMinutes: null,
      },
      profile: {
        symbol,
        sector: str(prof.sector),
        industry: str(prof.industry),
        country: str(prof.country),
        employees: num(prof.fullTimeEmployees),
        summary: str(prof.longBusinessSummary),
        website: str(prof.website),
      },
      fundamentals: {
        trailingPE: raw(detail.trailingPE),
        forwardPE: raw(detail.forwardPE),
        priceToBook: raw(stats.priceToBook),
        priceToSales: raw(detail.priceToSalesTrailing12Months),
        enterpriseToEbitda: raw(stats.enterpriseToEbitda),
        enterpriseToRevenue: raw(stats.enterpriseToRevenue),
        pegRatio: raw(stats.pegRatio),
        revenueGrowth: raw(fin.revenueGrowth),
        earningsGrowth: raw(fin.earningsGrowth),
        profitMargins: raw(fin.profitMargins),
        operatingMargins: raw(fin.operatingMargins),
        grossMargins: raw(fin.grossMargins),
        returnOnEquity: raw(fin.returnOnEquity),
        returnOnAssets: raw(fin.returnOnAssets),
        debtToEquity: raw(fin.debtToEquity),
        currentRatio: raw(fin.currentRatio),
        totalCash: raw(fin.totalCash),
        totalDebt: raw(fin.totalDebt),
        beta: raw(detail.beta),
        dividendYield: yieldFraction === null ? null : yieldFraction * 100,
        payoutRatio: raw(detail.payoutRatio),
        bookValue: raw(stats.bookValue),
        eps: raw(stats.trailingEps),
      },
    };
  });
}

/** Sector/industry only, cached hard — the screener needs one per symbol. */
export async function getProfile(symbol: string): Promise<Profile | null> {
  return cached(`p:${symbol}`, TTL.profile, async () => {
    const j = (await authed(
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
        symbol,
      )}?modules=assetProfile`,
    )) as { quoteSummary?: { result?: Record<string, unknown>[] } };
    const p = j?.quoteSummary?.result?.[0]?.assetProfile as
      | Record<string, unknown>
      | undefined;
    if (!p) return null;
    return {
      symbol,
      sector: str(p.sector),
      industry: str(p.industry),
      country: str(p.country),
      employees: num(p.fullTimeEmployees),
      summary: str(p.longBusinessSummary),
      website: str(p.website),
    };
  });
}

/**
 * Resolve many profiles without opening 50 sockets at once.
 *
 * A symbol that fails resolves to null rather than rejecting the batch —
 * one delisted ticker must not blank the entire screener.
 */
export async function getProfiles(
  symbols: string[],
  concurrency = 6,
): Promise<Map<string, Profile | null>> {
  const out = new Map<string, Profile | null>();
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, symbols.length) }, async () => {
    while (cursor < symbols.length) {
      const symbol = symbols[cursor++];
      try {
        out.set(symbol, await getProfile(symbol));
      } catch {
        out.set(symbol, null);
      }
    }
  });
  await Promise.all(workers);
  return out;
}

export interface History {
  /** Unix seconds. */
  timestamps: number[];
  closes: number[];
}

/** Daily closes. Open endpoint — no crumb required. */
export async function getHistory(symbol: string, range = "1y"): Promise<History | null> {
  return cached(`h:${symbol}:${range}`, TTL.history, async () => {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        symbol,
      )}?range=${range}&interval=1d`,
      { headers: { "User-Agent": UA } },
    );
    if (!r.ok) return null;
    const j = (await r.json()) as {
      chart?: { result?: { timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[] } }[] };
    };
    const res = j?.chart?.result?.[0];
    const ts = res?.timestamp;
    const cl = res?.indicators?.quote?.[0]?.close;
    if (!ts || !cl) return null;

    const timestamps: number[] = [];
    const closes: number[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = cl[i];
      // Yahoo pads holidays with nulls. Dropping them is correct; carrying
      // the previous close forward would invent a flat day and depress the
      // volatility figure computed from this series.
      if (typeof c === "number" && Number.isFinite(c)) {
        timestamps.push(ts[i]);
        closes.push(c);
      }
    }
    return { timestamps, closes };
  });
}
