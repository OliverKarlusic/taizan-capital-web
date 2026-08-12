/**
 * The screener's universe, fetched from real index constituent lists.
 *
 * ── WHY THIS REPLACED A HAND-WRITTEN LIST ───────────────────────────
 * The universe used to be 58 symbols typed into a file. Every one was a
 * real company, but the list itself was an editorial invention presented
 * as market coverage, and it could go stale without anyone noticing — a
 * company leaves the index and the screener keeps screening it.
 *
 * These are sourced instead:
 *
 *   S&P 500   datasets/s-and-p-500-companies on GitHub, a maintained CSV
 *             mirror of the Wikipedia constituent table. Carries the GICS
 *             sector, which means the screener gets sectors without one
 *             profile request per symbol.
 *   ASX 200   The S&P/ASX 200 constituent table on Wikipedia. Carries the
 *             sector too.
 *
 * ── WHAT HAPPENS WHEN A SOURCE IS DOWN ──────────────────────────────
 * Nothing is substituted. If a list fails to load, that index contributes
 * no rows and the response says which source failed. There is no bundled
 * fallback list, because a stale hardcoded copy masquerading as today's
 * index is precisely the failure this file exists to remove.
 *
 * ── NASDAQ ──────────────────────────────────────────────────────────
 * There is no separate Nasdaq list here. The Nasdaq-100 article no longer
 * publishes a components table, and the Nasdaq Composite runs to roughly
 * 3,000 mostly micro-cap lines that the free fundamentals tier cannot
 * serve. Nasdaq-listed large caps are already in the S&P 500, and the
 * market each line trades on is read from the quote feed rather than
 * assumed here — so the Nasdaq filter works without a list to back it.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const SP500_CSV =
  "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv";
const ASX200_WIKI = "https://en.wikipedia.org/wiki/S%26P/ASX_200";

export interface Constituent {
  /** Yahoo symbol. ASX lines carry the .AX suffix. */
  symbol: string;
  name: string;
  /** As published by the index source, not by the quote feed. */
  sector: string | null;
  index: "S&P 500" | "S&P/ASX 200";
}

export interface UniverseResult {
  constituents: Constituent[];
  /** Which sources answered, and which did not. */
  sources: { name: string; url: string; count: number; ok: boolean }[];
  fetchedAt: string;
}

/* ── parsing ──────────────────────────────────────────────────────── */

/** Minimal RFC4180 CSV: handles quoted fields containing commas. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const stripTags = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "")
    .replace(/\[\d+\]/g, "")
    .trim();

/** Pull the rows out of every wikitable on a page. */
function wikiTables(html: string): string[][][] {
  const tables: string[][][] = [];
  const tableRe = /<table[^>]*class="[^"]*wikitable[^"]*"[\s\S]*?<\/table>/g;
  let t: RegExpExecArray | null;
  while ((t = tableRe.exec(html))) {
    const rows: string[][] = [];
    const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    let r: RegExpExecArray | null;
    while ((r = rowRe.exec(t[0]))) {
      const cells = [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(
        (c) => stripTags(c[1]),
      );
      if (cells.length) rows.push(cells);
    }
    if (rows.length) tables.push(rows);
  }
  return tables;
}

/* ── sources ──────────────────────────────────────────────────────── */

async function fetchSp500(): Promise<Constituent[]> {
  const r = await fetch(SP500_CSV, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`S&P 500 source returned ${r.status}`);
  const rows = parseCsv(await r.text());
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const iSym = header.indexOf("symbol");
  const iName = header.indexOf("security");
  const iSector = header.findIndex((h) => h.includes("gics sector"));
  if (iSym < 0 || iName < 0) throw new Error("S&P 500 CSV shape changed");

  return rows.slice(1).map((c) => ({
    // BRK.B in the index, BRK-B at Yahoo. Class shares are the only case.
    symbol: c[iSym].trim().replace(/\./g, "-"),
    name: c[iName].trim(),
    sector: iSector >= 0 ? c[iSector].trim() || null : null,
    index: "S&P 500" as const,
  }));
}

async function fetchAsx200(): Promise<Constituent[]> {
  const r = await fetch(ASX200_WIKI, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`ASX 200 source returned ${r.status}`);
  const tables = wikiTables(await r.text());

  // Pick the table by its header rather than its position, so a new
  // table added above the constituents does not silently shift this.
  const table = tables.find((rows) => {
    const h = rows[0].map((c) => c.toLowerCase());
    return h.includes("code") && h.some((c) => c.includes("company"));
  });
  if (!table) throw new Error("ASX 200 constituent table not found");

  const header = table[0].map((c) => c.toLowerCase());
  const iCode = header.indexOf("code");
  const iName = header.findIndex((c) => c.includes("company"));
  const iSector = header.findIndex((c) => c.includes("sector"));

  return table
    .slice(1)
    .filter((c) => /^[A-Z0-9]{2,4}$/.test((c[iCode] || "").trim()))
    .map((c) => ({
      symbol: `${c[iCode].trim()}.AX`,
      name: (c[iName] || "").trim(),
      sector: iSector >= 0 ? (c[iSector] || "").trim() || null : null,
      index: "S&P/ASX 200" as const,
    }));
}

/* ── cache ────────────────────────────────────────────────────────── */

/**
 * Constituent lists change on index review, not by the minute. A day is a
 * generous refresh and keeps the screener off these sources entirely for
 * almost every request.
 */
const TTL = 24 * 60 * 60_000;
let cache: { value: UniverseResult; expires: number } | null = null;
let inFlight: Promise<UniverseResult> | null = null;

async function load(): Promise<UniverseResult> {
  const sources: UniverseResult["sources"] = [];
  const constituents: Constituent[] = [];

  const jobs: [string, string, () => Promise<Constituent[]>][] = [
    ["S&P 500", SP500_CSV, fetchSp500],
    ["S&P/ASX 200", ASX200_WIKI, fetchAsx200],
  ];

  const settled = await Promise.allSettled(jobs.map(([, , fn]) => fn()));
  settled.forEach((res, i) => {
    const [name, url] = jobs[i];
    if (res.status === "fulfilled") {
      constituents.push(...res.value);
      sources.push({ name, url, count: res.value.length, ok: true });
    } else {
      sources.push({ name, url, count: 0, ok: false });
    }
  });

  // A company can appear in both lists via a secondary listing; keep one.
  const seen = new Set<string>();
  const deduped = constituents.filter((c) =>
    seen.has(c.symbol) ? false : (seen.add(c.symbol), true),
  );

  return { constituents: deduped, sources, fetchedAt: new Date().toISOString() };
}

export async function getUniverse(): Promise<UniverseResult> {
  if (cache && cache.expires > Date.now()) return cache.value;
  if (!inFlight) {
    inFlight = load().finally(() => {
      inFlight = null;
    });
  }
  const value = await inFlight;
  // Only cache a result that actually has rows — caching a total outage
  // for a day would turn a transient failure into an all-day one.
  if (value.constituents.length) cache = { value, expires: Date.now() + TTL };
  return value;
}

/**
 * Strategies Taizan holds, so a company page can note the fact.
 *
 * Stating that a business is held is a fact about the firm's own book and
 * is disclosed elsewhere on this site. It is not a recommendation and the
 * page must not present it as one.
 */
export const TAIZAN_HOLDINGS: Record<string, string> = {
  "NXT.AX": "Long Term Growth",
  "CSL.AX": "Long Term Growth",
  MSFT: "Growth Maximisation",
  UNH: "Options — closed position",
  PFE: "Options — closed position",
};

export const heldIn = (symbol: string): string | null =>
  TAIZAN_HOLDINGS[symbol] ?? null;
