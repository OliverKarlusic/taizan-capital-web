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

import { isFuture } from "./clock";
import { budgeter } from "./budget";
import {
  expenseRatio as domainExpenseRatio,
  netAssets as domainNetAssets,
  price as domainPrice,
  weight as domainWeight,
} from "./domain";

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

/**
 * GET with the session attached, retrying once on 401 with a fresh one.
 *
 * Routed through the budgeter, which deduplicates identical in-flight
 * URLs and holds the call rather than exceeding the window. The key is
 * the full URL because that is what identifies the answer — keying on
 * the symbol alone would serve a profile request the quote response.
 */
async function authed(url: string): Promise<unknown> {
  return budgeter.run("yahoo", url, () => authedRaw(url));
}

async function authedRaw(url: string): Promise<unknown> {
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

/**
 * quoteSummary wraps numbers as { raw, fmt }. This unwraps them and
 * refuses the provider's placeholder zero.
 *
 * ── EMPIRICALLY DERIVED, NOT GUESSED ────────────────────────────────
 * scripts/audit-placeholders.mjs walks every wrapper across a sample of
 * US and ASX equities and ETFs and classifies it. The result is
 * unambiguous:
 *
 *   {raw: 0, fmt: null}  appears on 9 fields, and on those fields a
 *                        genuine value NEVER appears — 0 real out of 28
 *                        observations for each income-statement line.
 *                        It is a stripped field, not a measurement.
 *
 *   {raw: 0, fmt: "0%"}  appears on 7 fields — payoutRatio for a company
 *                        that pays no dividend, regularMarketChange on a
 *                        flat close, grossMargins where genuinely nil.
 *                        These are real zeros and must survive.
 *
 * So the discriminator is `fmt`, and it is applied here rather than at
 * each call site. Every accessor in this file inherits it, which means a
 * field added later cannot reintroduce the bug by forgetting a guard.
 * Non-zero values pass through untouched regardless of fmt.
 */
const raw = (v: unknown): number | null => {
  const o = v as { raw?: unknown; fmt?: unknown } | undefined;
  const n = num(o?.raw);
  if (n === 0 && o?.fmt === null) return null;
  return n;
};

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

/* ── company detail: statements, ownership, calendar, filings ─────── */

export interface IncomePeriod {
  endDate: string | null;
  totalRevenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  researchDevelopment: number | null;
  sellingGeneralAdministrative: number | null;
  totalOperatingExpenses: number | null;
  operatingIncome: number | null;
  ebit: number | null;
  interestExpense: number | null;
  incomeBeforeTax: number | null;
  incomeTaxExpense: number | null;
  netIncome: number | null;
}

export interface Holder {
  organization: string;
  reportDate: string | null;
  pctHeld: number | null;
  position: number | null;
  value: number | null;
}

export interface Insider {
  name: string;
  relation: string | null;
  transaction: string | null;
  date: string | null;
}

export interface Filing {
  date: string;
  type: string;
  title: string;
  url: string | null;
}

export interface NewsItem {
  title: string;
  publisher: string | null;
  link: string;
  published: string | null;
}

export interface CompanyDetail {
  income: IncomePeriod[];
  ownership: {
    insidersPercentHeld: number | null;
    institutionsPercentHeld: number | null;
    institutionsCount: number | null;
    topHolders: Holder[];
    insiders: Insider[];
  };
  calendar: {
    earningsDate: string | null;
    earningsDateIsEstimate: boolean;
    exDividendDate: string | null;
    dividendDate: string | null;
  };
  filings: Filing[];
  /** True when the filings endpoint has no coverage for this listing. */
  filingsUnsupported: boolean;
  news: NewsItem[];
  /**
   * Yahoo still returns balance-sheet and cash-flow periods, but with the
   * line items stripped — every statement comes back carrying only its
   * end date. Recorded here so the page can say precisely that, rather
   * than implying the work simply has not been done.
   */
  balanceSheetEmpty: boolean;
  cashFlowEmpty: boolean;
}

const fmtDate = (v: unknown): string | null =>
  (v as { fmt?: string } | undefined)?.fmt ?? null;

/* Statement lines use the same guarded accessor as everything else —
   see the note on `raw` above for why the guard lives there. */

const DETAIL_MODULES = [
  "incomeStatementHistory",
  "balanceSheetHistory",
  "cashflowStatementHistory",
  "calendarEvents",
  "majorHoldersBreakdown",
  "institutionOwnership",
  "insiderHolders",
  "secFilings",
].join(",");

export async function getCompanyDetail(
  symbol: string,
): Promise<CompanyDetail | null> {
  return cached(`d:${symbol}`, TTL.summary, async () => {
    let j: { quoteSummary?: { result?: Record<string, unknown>[] } };
    try {
      j = (await authed(
        `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
          symbol,
        )}?modules=${DETAIL_MODULES}`,
      )) as { quoteSummary?: { result?: Record<string, unknown>[] } };
    } catch (e) {
      // secFilings 404s for non-US listings and takes the whole request
      // with it, so retry without it before giving up.
      if (e instanceof UpstreamError && e.status === 404) {
        try {
          j = (await authed(
            `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
              symbol,
            )}?modules=${DETAIL_MODULES.replace(",secFilings", "")}`,
          )) as { quoteSummary?: { result?: Record<string, unknown>[] } };
        } catch {
          return null;
        }
      } else throw e;
    }

    const r = j?.quoteSummary?.result?.[0];
    if (!r) return null;

    const inc =
      ((r.incomeStatementHistory as { incomeStatementHistory?: Record<string, unknown>[] })
        ?.incomeStatementHistory ?? []);
    const bal =
      ((r.balanceSheetHistory as { balanceSheetStatements?: Record<string, unknown>[] })
        ?.balanceSheetStatements ?? []);
    const cf =
      ((r.cashflowStatementHistory as { cashflowStatements?: Record<string, unknown>[] })
        ?.cashflowStatements ?? []);
    const cal = (r.calendarEvents ?? {}) as Record<string, unknown>;
    const calEarnings = (cal.earnings ?? {}) as Record<string, unknown>;
    const major = (r.majorHoldersBreakdown ?? {}) as Record<string, unknown>;
    const inst =
      ((r.institutionOwnership as { ownershipList?: Record<string, unknown>[] })
        ?.ownershipList ?? []);
    const insid =
      ((r.insiderHolders as { holders?: Record<string, unknown>[] })?.holders ?? []);
    const filings =
      ((r.secFilings as { filings?: Record<string, unknown>[] })?.filings ?? []);

    /**
     * A statement is empty when its periods carry no line items.
     *
     * `netIncome` is excluded from the count for the cash-flow statement:
     * it is the opening line carried across from the income statement, not
     * a cash-flow measure, and treating it as content would report a
     * statement as present when every operating, investing and financing
     * figure is absent.
     */
    const hollow = (rows: Record<string, unknown>[], ignore: string[] = []) =>
      rows.length === 0 ||
      rows.every(
        (row) =>
          Object.keys(row).filter(
            (k) => k !== "maxAge" && k !== "endDate" && !ignore.includes(k),
          ).length === 0,
      );

    return {
      income: inc.map((p) => ({
        endDate: fmtDate(p.endDate),
        totalRevenue: raw(p.totalRevenue),
        costOfRevenue: raw(p.costOfRevenue),
        grossProfit: raw(p.grossProfit),
        researchDevelopment: raw(p.researchDevelopment),
        sellingGeneralAdministrative: raw(p.sellingGeneralAdministrative),
        totalOperatingExpenses: raw(p.totalOperatingExpenses),
        operatingIncome: raw(p.operatingIncome),
        ebit: raw(p.ebit),
        interestExpense: raw(p.interestExpense),
        incomeBeforeTax: raw(p.incomeBeforeTax),
        incomeTaxExpense: raw(p.incomeTaxExpense),
        netIncome: raw(p.netIncome),
      })),
      ownership: {
        insidersPercentHeld: raw(major.insidersPercentHeld),
        institutionsPercentHeld: raw(major.institutionsPercentHeld),
        institutionsCount: raw(major.institutionsCount),
        topHolders: inst.map((h) => ({
          organization: String(h.organization ?? "—"),
          reportDate: fmtDate(h.reportDate),
          pctHeld: raw(h.pctHeld),
          position: raw(h.position),
          value: raw(h.value),
        })),
        insiders: insid.map((h) => ({
          name: String(h.name ?? "—"),
          relation: str(h.relation),
          transaction: str(h.transactionDescription),
          date: fmtDate(h.latestTransDate),
        })),
      },
      calendar: {
        earningsDate: Array.isArray(calEarnings.earningsDate)
          ? fmtDate((calEarnings.earningsDate as unknown[])[0])
          : null,
        earningsDateIsEstimate: Boolean(calEarnings.isEarningsDateEstimate),
        exDividendDate: fmtDate(cal.exDividendDate),
        dividendDate: fmtDate(cal.dividendDate),
      },
      filings: filings.slice(0, 12).map((f) => ({
        date: String(f.date ?? ""),
        type: String(f.type ?? ""),
        title: String(f.title ?? ""),
        url: str(f.edgarUrl),
      })),
      filingsUnsupported: !r.secFilings,
      news: [],
      balanceSheetEmpty: hollow(bal),
      cashFlowEmpty: hollow(cf, ["netIncome"]),
    };
  });
}

/**
 * Headlines whose wording reads as a recommendation.
 *
 * ── WHY A SYNDICATED FEED HAS TO BE FILTERED ────────────────────────
 * The feed returns items like "3 Stocks to Buy Now" and "Analyst Predicts
 * …". Those are the publisher's words, not Taizan's, and each is
 * attributed and linked. But they would be rendering inside the firm's own
 * research terminal, on a site whose entire position is that the firm
 * publishes no recommendations and is not licensed to. A reader — or a
 * regulator — is entitled to read a headline the firm chose to surface as
 * something the firm is comfortable surfacing.
 *
 * Nothing here judges the article. The test is only whether its headline
 * is phrased as advice, and excluded items are declared on the page rather
 * than quietly dropped.
 */
const RECOMMENDATION_WORDING =
  /\b(buy|sell|hold|short)\s+(now|these|this|the|before|stock|stocks)\b|\bstocks?\s+to\s+(buy|sell|watch|own|avoid|hold|consider)\b|\b(top|best|worst)\s+\d*\s*(stock|pick|buy)s?\b|\bprice\s+target\b|\b(upgrade|downgrade)[ds]?\b|\b(overweight|underweight|outperform|underperform)\b|\bstrong\s+buy\b|\bmust[- ]own\b|\bshould\s+(you|investors)\s+(buy|sell|avoid|own)\b|\bavoid\s+the\s+stock\b/i;

export const readsAsRecommendation = (title: string) =>
  RECOMMENDATION_WORDING.test(title);

/**
 * Headlines about this company, each linking out to its publisher.
 *
 * ── WHY RELEVANCE IS ENFORCED HERE ──────────────────────────────────
 * The search endpoint pads its news array with general market items. A
 * query for BHP.AX came back with stories about Air Canada, Meta and
 * E.ON — none of which mention BHP. Rendered under a heading reading
 * "Recent coverage" on BHP's own page, that tells the reader those
 * stories are about the company they are researching, which is false.
 *
 * An item is kept only when the feed's own relatedTickers names this
 * symbol, or the headline mentions the ticker or the company name. When
 * nothing survives, the page says there are no recent items — which is a
 * true statement about this company's coverage, and better than a list of
 * someone else's news.
 */
export async function getNews(
  symbol: string,
  companyName?: string | null,
): Promise<NewsItem[]> {
  return cached(`n:${symbol}:${companyName ?? ""}`, TTL.summary, async () => {
    try {
      const r = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
          symbol,
        )}&newsCount=16&quotesCount=0`,
        { headers: { "User-Agent": UA } },
      );
      if (!r.ok) return [];
      const j = (await r.json()) as { news?: Record<string, unknown>[] };

      const bare = symbol.replace(/\..*$/, "").toUpperCase();
      // "BHP Group Limited" → "bhp group": drop the corporate suffix so a
      // headline saying "BHP Group" still matches.
      const nameStem = (companyName ?? "")
        .toLowerCase()
        .replace(
          /\b(inc|corp|corporation|company|co|ltd|limited|plc|group|holdings|nv|sa|se|ag)\b\.?/g,
          "",
        )
        .replace(/[^a-z ]/g, "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join(" ");

      /**
       * The headline must name the company. relatedTickers is deliberately
       * not trusted: the feed tags articles very broadly, and using it let
       * stories about PepsiCo, SpaceX and Bechtle through onto NVIDIA's
       * page. A tag is the publisher's idea of loosely relevant; a mention
       * in the headline is evidence the piece is about this company.
       *
       * This is strict, and for most listings it returns nothing. That is
       * the honest state of a free feed, and an empty section that says so
       * beats a full one that misleads.
       */
      const mentions = (n: Record<string, unknown>) => {
        const title = String(n.title ?? "");
        if (new RegExp(`\\b${bare}\\b`).test(title.toUpperCase())) return true;
        return nameStem.length > 3 && title.toLowerCase().includes(nameStem);
      };

      return (j.news ?? [])
        .filter((n) => n.title && n.link)
        .filter(mentions)
        .filter((n) => !readsAsRecommendation(String(n.title)))
        .slice(0, 8)
        .map((n) => ({
          title: String(n.title),
          publisher: str(n.publisher),
          link: String(n.link),
          published:
            typeof n.providerPublishTime === "number"
              ? new Date(n.providerPublishTime * 1000).toISOString()
              : null,
        }));
    } catch {
      return [];
    }
  });
}

export interface History {
  /** Unix seconds. */
  timestamps: number[];
  closes: number[];
  /**
   * IANA zone of the listing exchange, e.g. America/New_York.
   *
   * Carried with the series because a session date belongs to the
   * exchange rather than to the reader: Apple closing on the 14th is
   * the 14th in New York whoever is looking at it.
   */
  exchangeTimezone: string | null;
}

/**
 * Keep the observations that actually happened.
 *
 * Two filters, for two different kinds of non-observation:
 *
 * 1. Nulls. Yahoo pads holidays with them. Dropping them is correct;
 *    carrying the previous close forward would invent a flat day and
 *    depress the volatility figure computed from this series.
 *
 * 2. Future timestamps. The chart endpoint returns a bar for the session
 *    in progress, and around the open it can carry a timestamp ahead of
 *    the current instant. A chart that plots it is asserting that a
 *    session closed at a price when the session has not closed — and on
 *    a page whose whole claim is that nothing here is invented, a
 *    fabricated final bar is exactly the wrong thing to ship.
 *
 * Exported for the test, which is the only way to assert the second
 * filter without waiting for a market to open.
 */
export function dropFuture(
  ts: number[],
  cl: (number | null | undefined)[],
  now = Date.now(),
  exchangeTimezone: string | null = null,
): History {
  const timestamps: number[] = [];
  const closes: number[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = cl[i];
    if (typeof c !== "number" || !Number.isFinite(c)) continue;
    if (isFuture(ts[i], now)) continue;
    timestamps.push(ts[i]);
    closes.push(c);
  }
  return { timestamps, closes, exchangeTimezone };
}

/** Daily closes. Open endpoint — no crumb required. */
export async function getHistory(
  symbol: string,
  range = "1y",
  interval = "1d",
): Promise<History | null> {
  return cached(`h:${symbol}:${range}:${interval}`, TTL.history, async () => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol,
    )}?range=${range}&interval=${interval}`;
    // The chart endpoint needs no crumb, but it is the same upstream and
    // the same quota, so it is budgeted alongside everything else.
    const r = await budgeter.run("yahoo", url, () =>
      fetch(url, { headers: { "User-Agent": UA } }),
    );
    if (!r.ok) return null;
    const j = (await r.json()) as {
      chart?: {
        result?: {
          timestamp?: number[];
          meta?: { exchangeTimezoneName?: string };
          indicators?: { quote?: { close?: (number | null)[] }[] };
        }[];
      };
    };
    const res = j?.chart?.result?.[0];
    const ts = res?.timestamp;
    const cl = res?.indicators?.quote?.[0]?.close;
    if (!ts || !cl) return null;

    return dropFuture(ts, cl, Date.now(), res?.meta?.exchangeTimezoneName ?? null);
  });
}

/* ── funds ────────────────────────────────────────────────────────── */

export interface FundHolding {
  symbol: string | null;
  name: string | null;
  /** Fraction of the portfolio, 0–1. */
  weight: number | null;
}

export interface Fund {
  issuer: string | null;
  category: string | null;
  legalType: string | null;
  /** Fraction, 0–1. Null where the provider's figure cannot be real. */
  expenseRatio: number | null;
  netAssets: number | null;
  navPrice: number | null;
  yield: number | null;
  inceptionDate: string | null;
  holdings: FundHolding[];
  /** How many the provider returned, which is not the fund's real count. */
  holdingsReturned: number;
  sectorWeights: { sector: string; weight: number | null }[];
  /** Fraction of the portfolio the returned holdings account for. */
  holdingsCoverage: number | null;
}

const FUND_MODULES = [
  "fundProfile",
  "topHoldings",
  "defaultKeyStatistics",
  "summaryDetail",
].join(",");

/**
 * Fund-level data for an ETF or managed fund.
 *
 * ── WHAT THIS DELIBERATELY DOES NOT CLAIM ───────────────────────────
 * `holdings` is what the provider returned, which for every fund tested
 * is the top ten and never the full register. A fund of 300 lines shown
 * as ten without saying so reads as a complete portfolio, so the count
 * and the weight those ten actually cover are both carried out of here
 * and stated on screen. Coverage is the honest figure: ten lines summing
 * to 45% of VAS says more than "10 holdings" ever could.
 *
 * Expense ratio runs through the domain guard rather than the generic
 * accessor, because the provider returns a *formatted* zero for
 * ASX-listed funds — see domain.ts. That is the one field here where
 * publishing the provider's number unaltered would state something
 * false about the cost of holding the investment.
 */
export async function getFund(symbol: string): Promise<Fund | null> {
  return cached(`fund:${symbol}`, TTL.profile, async () => {
    let j: { quoteSummary?: { result?: Record<string, unknown>[] } };
    try {
      j = (await authed(
        `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
          symbol,
        )}?modules=${FUND_MODULES}`,
      )) as { quoteSummary?: { result?: Record<string, unknown>[] } };
    } catch {
      return null;
    }

    const r = j?.quoteSummary?.result?.[0];
    if (!r) return null;

    const fp = (r.fundProfile ?? {}) as Record<string, unknown>;
    const th = (r.topHoldings ?? {}) as Record<string, unknown>;
    const ks = (r.defaultKeyStatistics ?? {}) as Record<string, unknown>;
    const sd = (r.summaryDetail ?? {}) as Record<string, unknown>;

    const fees = (fp.feesExpensesInvestment ?? {}) as Record<string, unknown>;

    const holdings: FundHolding[] = (
      (th.holdings as Record<string, unknown>[] | undefined) ?? []
    ).map((h) => ({
      symbol: str(h.symbol),
      name: str(h.holdingName),
      weight: domainWeight(raw(h.holdingPercent)),
    }));

    const covered = holdings.reduce((s, h) => s + (h.weight ?? 0), 0);

    const sectorWeights = (
      (th.sectorWeightings as Record<string, unknown>[] | undefined) ?? []
    )
      .map((s) => {
        const key = Object.keys(s)[0];
        return key
          ? { sector: key, weight: domainWeight(raw(s[key])) }
          : null;
      })
      .filter((x): x is { sector: string; weight: number | null } => x !== null);

    return {
      issuer: str(fp.family),
      category: str(fp.categoryName),
      legalType: str(fp.legalType),
      expenseRatio: domainExpenseRatio(raw(fees.annualReportExpenseRatio)),
      netAssets: domainNetAssets(raw(ks.totalAssets)),
      navPrice: domainPrice(raw(sd.navPrice)),
      yield: raw(sd.yield),
      inceptionDate:
        (ks.fundInceptionDate as { fmt?: string } | undefined)?.fmt ?? null,
      holdings,
      holdingsReturned: holdings.length,
      sectorWeights,
      holdingsCoverage: holdings.length ? covered : null,
    };
  });
}

/* ── estimates and distributions ──────────────────────────────────── */

export interface EstimatePeriod {
  /** Provider's label: 0q, +1q, 0y, +1y. */
  period: string;
  /** Period end, as the provider states it. Forward periods are future. */
  endDate: string | null;
  epsAvg: number | null;
  epsLow: number | null;
  epsHigh: number | null;
  epsAnalysts: number | null;
  epsYearAgo: number | null;
  revenueAvg: number | null;
  revenueLow: number | null;
  revenueHigh: number | null;
  revenueAnalysts: number | null;
  revenueYearAgo: number | null;
  currency: string | null;
}

/**
 * Consensus estimates for the coming periods.
 *
 * ── WHAT IS TAKEN AND WHAT IS REFUSED ───────────────────────────────
 * The earningsTrend module carries estimate levels, the analyst count
 * behind each, and the year-ago comparative. All of that is evidence: a
 * reader can see what the market expects and how widely the estimates
 * disagree, and reach their own view.
 *
 * The sibling modules — recommendationTrend, financialData's
 * recommendationKey and targetMeanPrice — are not requested here. They
 * are free and well populated, and they are the verdict rather than the
 * evidence. See NEVER_INGEST in domain.ts: the boundary is at fetch
 * time, so a field that never enters the process cannot reach a table.
 *
 * ── ESTIMATES ARE DATED FORWARD, AND THAT IS CORRECT ────────────────
 * A +1y period ends in 2027. On a terminal where a future date was a
 * genuine defect, that distinction has to survive to the screen: these
 * are labelled as estimates, carry their analyst counts, and are never
 * mixed into the observed-history series.
 */
export async function getEstimates(
  symbol: string,
): Promise<EstimatePeriod[]> {
  return cached(`est:${symbol}`, TTL.summary, async () => {
    let j: { quoteSummary?: { result?: Record<string, unknown>[] } };
    try {
      j = (await authed(
        `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
          symbol,
        )}?modules=earningsTrend`,
      )) as { quoteSummary?: { result?: Record<string, unknown>[] } };
    } catch {
      return [];
    }
    const trend =
      ((j?.quoteSummary?.result?.[0]?.earningsTrend as
        | { trend?: Record<string, unknown>[] }
        | undefined)?.trend ?? []);

    return trend
      .map((t) => {
        const e = (t.earningsEstimate ?? {}) as Record<string, unknown>;
        const r = (t.revenueEstimate ?? {}) as Record<string, unknown>;
        return {
          period: str(t.period) ?? "",
          endDate: str(t.endDate),
          epsAvg: raw(e.avg),
          epsLow: raw(e.low),
          epsHigh: raw(e.high),
          epsAnalysts: raw(e.numberOfAnalysts),
          epsYearAgo: raw(e.yearAgoEps),
          revenueAvg: raw(r.avg),
          revenueLow: raw(r.low),
          revenueHigh: raw(r.high),
          revenueAnalysts: raw(r.numberOfAnalysts),
          revenueYearAgo: raw(r.yearAgoRevenue),
          currency: str(e.earningsCurrency) ?? str(r.revenueCurrency),
        };
      })
      // A period with neither an EPS nor a revenue estimate is a row of
      // dashes; the provider returns those for thinly covered listings.
      .filter((p) => p.epsAvg !== null || p.revenueAvg !== null);
  });
}

export interface Distribution {
  /** Unix seconds — the ex-date, in the exchange's calendar. */
  date: number;
  amount: number;
}

/**
 * Dividend and distribution history from the chart endpoint's events.
 *
 * Open endpoint, no crumb. Returned newest first. Amounts are per share
 * in the listing currency, and are as-paid rather than adjusted, which
 * is why they are not derived from the adjusted close series.
 */
export async function getDistributions(
  symbol: string,
  range = "5y",
): Promise<{ rows: Distribution[]; exchangeTimezone: string | null }> {
  return cached(`div:${symbol}:${range}`, TTL.history, async () => {
    try {
      const r = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
          symbol,
        )}?range=${range}&interval=1d&events=div%2Csplit`,
        { headers: { "User-Agent": UA } },
      );
      if (!r.ok) return { rows: [], exchangeTimezone: null };
      const res = (
        (await r.json()) as {
          chart?: {
            result?: {
              meta?: { exchangeTimezoneName?: string };
              events?: { dividends?: Record<string, { date?: number; amount?: number }> };
            }[];
          };
        }
      )?.chart?.result?.[0];

      const rows = Object.values(res?.events?.dividends ?? {})
        .map((d) => ({ date: num(d.date), amount: num(d.amount) }))
        .filter(
          (d): d is Distribution =>
            d.date !== null && d.amount !== null && d.amount > 0,
        )
        // A distribution dated after now has not been paid. The same
        // rule as the price series: nothing is shown as having happened
        // until it has.
        .filter((d) => !isFuture(d.date))
        .sort((a, b) => b.date - a.date);

      return {
        rows,
        exchangeTimezone: res?.meta?.exchangeTimezoneName ?? null,
      };
    } catch {
      return { rows: [], exchangeTimezone: null };
    }
  });
}
