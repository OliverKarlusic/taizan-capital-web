"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { ScreenerRow } from "@/app/api/research/screener/route";
import {
  DASH,
  decimal,
  marketCap as fmtCap,
  meaningfulRatio,
  multiple,
  percent,
  signedPercent,
} from "@/lib/research/format";
import { marketDateTime } from "@/lib/research/clock";
import { sessionSummary } from "@/lib/research/session";
import { virtualRange } from "@/lib/research/virtual";
import {
  applyGroups,
  buildStats,
  excludedForMissingData,
  type Group,
} from "@/lib/research/filters";
import FilterBuilder from "@/components/research/FilterBuilder";

/**
 * The Market Screener — the Terminal's entry point.
 *
 * ── SORTING WITH MISSING VALUES ─────────────────────────────────────
 * Three companies in the universe have no trailing P/E because they are
 * not currently profitable. The obvious implementation sorts null as 0 and
 * parks them at the top of an ascending P/E sort, directly where a reader
 * scanning for low multiples will land. That is actively misleading, so
 * nulls sort to the end in both directions and stay visibly em-dashed.
 *
 * ── COLOUR ──────────────────────────────────────────────────────────
 * Price moves use gold for up and ice for down: the site's own two
 * accents. The brief rules out the bright green and red of a trading app,
 * and rightly — but a table of a hundred numbers still needs a scanning
 * cue. Using the existing palette gives direction without importing the
 * aesthetic.
 */

type SortKey =
  | "name"
  | "price"
  | "changePercent"
  | "marketCap"
  | "trailingPE"
  | "priceToBook"
  | "dividendYield";

interface Payload {
  rows: ScreenerRow[];
  asOf: string;
  delayMinutes: number | null;
  quotedCount: number;
  universe: {
    sources: { name: string; url: string; count: number; ok: boolean }[];
    fetchedAt: string;
    total: number;
  };
}

/**
 * Row heights, measured rather than guessed.
 *
 * The virtualiser needs a uniform height per layout. These are the
 * rendered heights of a table row and a phone card at the current type
 * scale; if either changes, the window drifts and rows jump as you
 * scroll, which is why they are named here rather than inlined.
 */
const ROW_H_TABLE = 57;
const ROW_H_CARD = 158;

const COLUMNS: {
  key: SortKey;
  label: string;
  numeric: boolean;
  hideBelow?: string;
}[] = [
  { key: "name", label: "Company", numeric: false },
  { key: "price", label: "Price", numeric: true },
  { key: "changePercent", label: "Change", numeric: true },
  { key: "marketCap", label: "Market cap", numeric: true },
  { key: "trailingPE", label: "P/E", numeric: true },
  { key: "priceToBook", label: "P/B", numeric: true, hideBelow: "lg" },
  { key: "dividendYield", label: "Yield", numeric: true },
];

/** Nulls last, always — see the note above. */
function compare(a: number | null, b: number | null, dir: 1 | -1) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * dir;
}

export default function ScreenerClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [market, setMarket] = useState("All");
  const [sector, setSector] = useState("All");
  const [maxPE, setMaxPE] = useState("");
  const [minYield, setMinYield] = useState("");
  const [minCap, setMinCap] = useState("");
  /**
   * Compound conditions, on top of the quick filters above.
   *
   * The three number boxes stay: "P/E under 20" is the most common
   * request and should not need a group builder. Groups are for the
   * questions the boxes cannot ask — a rank across the universe, or a
   * comparison against a company's own sector.
   */
  const [groups, setGroups] = useState<Group[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  /**
   * Where the reader is, in the list's own coordinates.
   *
   * The list scrolls with the page rather than inside a fixed-height
   * box: a research table that traps the scroll wheel is a table you
   * have to escape to read the disclosure underneath it. So the offset
   * is derived from the window against the list's position in the
   * document, which keeps one scrollbar on the page.
   */
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/research/screener");
        const j = await r.json();
        if (!alive) return;
        if (!r.ok) {
          setError(j.error ?? "Market data is unavailable.");
        } else {
          setData(j);
        }
      } catch {
        if (alive) setError("Market data could not be reached.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const sectors = useMemo(() => {
    const s = new Set<string>();
    for (const r of data?.rows ?? []) if (r.sector) s.add(r.sector);
    return [...s].sort();
  }, [data]);

  /**
   * Markets come from the data, not from a hardcoded list.
   *
   * They were fixed as ASX/NYSE/Nasdaq, which left one S&P 500
   * constituent trading on Cboe US with no way to filter to it — a row
   * present in the table and absent from every facet. Deriving the
   * options means a constituent can never become unreachable because a
   * listing moved.
   */
  const markets = useMemo(() => {
    const m = new Set<string>();
    for (const r of data?.rows ?? []) if (r.market && r.market !== "—") m.add(r.market);
    return [...m].sort();
  }, [data]);

  const rows = useMemo(() => {
    let out = [...(data?.rows ?? [])];
    const q = query.trim().toLowerCase();

    if (q) {
      out = out.filter(
        (r) =>
          r.symbol.toLowerCase().includes(q) ||
          (r.name ?? "").toLowerCase().includes(q),
      );
    }
    if (market !== "All") out = out.filter((r) => r.market === market);
    if (sector !== "All") out = out.filter((r) => r.sector === sector);

    // A company with no P/E is not a company with a low P/E, and a company
    // with a NEGATIVE P/E is not the cheapest company on the exchange —
    // it is one with no earnings. Both are excluded from a maximum filter
    // rather than passing under the bar, and meaningfulRatio keeps them
    // out of the sort for the same reason.
    const pe = Number(maxPE);
    if (maxPE && Number.isFinite(pe)) {
      out = out.filter(
        (r) => meaningfulRatio(r.trailingPE) !== null && r.trailingPE! <= pe,
      );
    }
    const dy = Number(minYield);
    if (minYield && Number.isFinite(dy)) {
      out = out.filter((r) => r.dividendYield !== null && r.dividendYield >= dy);
    }
    const cap = Number(minCap);
    if (minCap && Number.isFinite(cap)) {
      out = out.filter((r) => r.marketCap !== null && r.marketCap >= cap * 1e9);
    }

    // Statistics come from the full covered universe, never from the
    // partially filtered list: a percentile computed after filtering
    // answers a different question than the reader asked.
    if (groups.length) {
      const stats = buildStats(data?.rows ?? []);
      out = applyGroups(out, groups, stats) as typeof out;
    }

    out.sort((a, b) => {
      if (sortKey === "name") {
        const an = a.name ?? a.symbol;
        const bn = b.name ?? b.symbol;
        return an.localeCompare(bn) * sortDir;
      }
      // Ratios sort on their meaningful value, so a negative multiple is
      // held out with the nulls instead of leading an ascending sort.
      const ratio = sortKey === "trailingPE" || sortKey === "priceToBook";
      const av = ratio ? meaningfulRatio(a[sortKey]) : a[sortKey];
      const bv = ratio ? meaningfulRatio(b[sortKey]) : b[sortKey];
      return compare(av, bv, sortDir);
    });
    return out;
  }, [data, query, market, sector, maxPE, minYield, minCap, sortKey, sortDir, groups]);

  // Any change to what is being shown returns to the first page. Staying
  // on page 8 of a result set that now has two pages shows an empty table
  // and reads as "no matches".
  useEffect(() => {
    // Filtering while scrolled down leaves the reader below a shorter
    // list. Returning to the top makes the new result set start where
    // they are looking.
    window.scrollTo({ top: Math.min(window.scrollY, listTop()), behavior: "auto" });
  }, [query, market, sector, maxPE, minYield, minCap, sortKey, sortDir, groups]);

  function listTop() {
    return listRef.current
      ? listRef.current.getBoundingClientRect().top + window.scrollY
      : 0;
  }

  useLayoutEffect(() => {
    const measure = () => {
      setViewportH(window.innerHeight);
      setIsPhone(window.innerWidth < 768);
      setScrollTop(Math.max(0, window.scrollY - listTop()));
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const range = virtualRange({
    count: rows.length,
    rowHeight: isPhone ? ROW_H_CARD : ROW_H_TABLE,
    viewportHeight: viewportH,
    scrollTop,
  });
  const visible = rows.slice(range.start, range.end);

  const setSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? 1 : -1);
    }
  };

  const reset = () => {
    setQuery("");
    setMarket("All");
    setSector("All");
    setMaxPE("");
    setMinYield("");
    setMinCap("");
    setGroups([]);
  };

  const filtered =
    query || market !== "All" || sector !== "All" || maxPE || minYield || minCap ||
    groups.some((g) => g.conditions.length > 0);

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className="border-b border-paper/10 bg-ink-soft">
        <div className="mx-auto max-w-[110rem] px-6 py-6 lg:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-6">
            <label className="relative block w-full lg:max-w-xs">
              <span className="mb-2 block text-[0.58rem] uppercase tracking-[0.22em] text-stone">
                Search
              </span>
              <Search
                size={14}
                strokeWidth={1.5}
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[0.7rem] left-3 text-stone-dim"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Company or code"
                /* py-3 on touch, py-2 from sm up: 44px targets on a phone,
                   the tighter workstation density on a desktop. */
                className="w-full border border-paper/15 bg-ink px-3 py-3 pl-9 text-[0.85rem] text-paper placeholder:text-stone-dim focus:border-gold/50 focus:outline-none sm:py-2"
              />
            </label>

            <Select
              label="Market"
              value={market}
              onChange={setMarket}
              options={["All", ...markets]}
            />
            <Select
              label="Sector"
              value={sector}
              onChange={setSector}
              options={["All", ...sectors]}
            />
            <Field
              label="Max P/E"
              value={maxPE}
              onChange={setMaxPE}
              placeholder="e.g. 20"
            />
            <Field
              label="Min yield %"
              value={minYield}
              onChange={setMinYield}
              placeholder="e.g. 3"
            />
            <Field
              label="Min cap (bn)"
              value={minCap}
              onChange={setMinCap}
              placeholder="e.g. 50"
            />

            {filtered ? (
              <button
                type="button"
                onClick={reset}
                className="min-h-11 self-start border border-paper/15 px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-stone transition-colors duration-300 hover:border-gold/40 hover:text-gold lg:self-auto"
              >
                Reset
              </button>
            ) : null}
          </div>

          <FilterBuilder
            groups={groups}
            onChange={setGroups}
            excluded={
              data ? excludedForMissingData(data.rows, groups) : 0
            }
          />

          {/* Freshness sits with the result count, above the table, not in
              the footnotes — a reader has to know how old a price is
              before they read it, not after. */}
          {!loading && !error && data ? (
            <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[0.65rem] tracking-wide">
              <span className="text-stone">
                {rows.length.toLocaleString("en-AU")} of{" "}
                {data.rows.length.toLocaleString("en-AU")} companies
              </span>
              <span className="text-stone-dim">
                Data as of {marketDateTime(data.asOf)}
                {data.delayMinutes
                  ? ` · delayed ~${data.delayMinutes} min, not real time`
                  : ""}
                {` · ${sessionSummary()} · delayed feed`}
              </span>
              <span className="text-stone-dim">
                {data.universe.sources
                  .filter((s) => s.ok)
                  .map((s) => `${s.name} (${s.count})`)
                  .join(" · ")}
              </span>
            </div>
          ) : (
            <p className="mt-5 text-[0.65rem] tracking-wide text-stone-dim">
              {loading ? "Loading delayed market data…" : "No data"}
            </p>
          )}

          {/* A source that failed is stated, not hidden. Its constituents
              are simply absent, and the reader is told the coverage is
              short rather than left to assume it is complete. */}
          {data?.universe.sources.some((s) => !s.ok) ? (
            <p className="mt-2 text-[0.65rem] text-ice">
              {data.universe.sources
                .filter((s) => !s.ok)
                .map((s) => s.name)
                .join(" and ")}{" "}
              could not be loaded, so those constituents are not listed. No
              substitute list is used.
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="mx-auto max-w-[110rem] px-6 py-8 lg:px-10">
        {error ? (
          <div className="border border-dashed border-paper/15 px-6 py-16 text-center">
            <p className="mx-auto max-w-[54ch] text-[0.95rem] font-light leading-[1.9] text-paper-dim">
              {error}
            </p>
            <p className="mx-auto mt-4 max-w-[54ch] text-[0.8rem] font-light leading-[1.85] text-stone">
              Nothing is displayed rather than a cached or estimated figure.
              Reload to try the feed again.
            </p>
          </div>
        ) : loading ? (
          <div className="py-16 text-center">
            <p className="text-[0.85rem] text-stone">
              Fetching delayed market data…
            </p>
            <p className="mx-auto mt-3 max-w-[52ch] text-[0.72rem] leading-relaxed text-stone-dim">
              The data service sleeps when idle on its free tier, so the
              first request after a quiet period can take a few seconds.
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="border border-dashed border-paper/15 px-6 py-16 text-center">
            <p className="text-[0.9rem] text-paper-dim">
              No company in the covered universe matches these filters.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 text-[0.7rem] uppercase tracking-[0.2em] text-gold hover:text-gold-bright"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Tablet and up: a real table.
                The floor is 42rem against a 768px container's 720px of
                content, so the table never needs to scroll sideways at any
                width where it is shown. It was 52rem and switching at sm,
                which put the sort buttons past the right edge on a 834px
                tablet — reachable only by a scroll gesture on a header
                row, which nobody performs. */}
            <div ref={listRef}>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[42rem] border-collapse text-left">
                <caption className="sr-only">
                  Screener results. Select a column heading to sort.
                </caption>
                <thead>
                  <tr className="border-b border-paper/15">
                    {COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={
                          sortKey === c.key
                            ? sortDir === 1
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        className={`py-3 text-[0.58rem] font-medium uppercase tracking-[0.2em] ${
                          c.numeric ? "text-right" : "text-left"
                        } ${c.hideBelow === "lg" ? "hidden lg:table-cell" : ""}`}
                      >
                        {/* The table appears from 768px up, which includes
                            touch tablets. Padding plus a matching negative
                            margin gives the sort control a 44px target
                            without growing the header row. */}
                        <button
                          type="button"
                          onClick={() => setSort(c.key)}
                          className={`-my-3 inline-flex min-h-11 items-center transition-colors duration-300 hover:text-paper ${
                            c.numeric ? "justify-end" : ""
                          } ${sortKey === c.key ? "text-gold" : "text-stone"}`}
                        >
                          {c.label}
                          {sortKey === c.key ? (
                            <span aria-hidden="true">
                              {sortDir === 1 ? " ↑" : " ↓"}
                            </span>
                          ) : null}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Spacer rows carry the height of the rows that are
                      not mounted, so the scrollbar reflects the whole
                      result rather than the slice on screen. */}
                  {range.paddingTop > 0 ? (
                    <tr aria-hidden="true" style={{ height: range.paddingTop }}>
                      <td colSpan={COLUMNS.length} />
                    </tr>
                  ) : null}
                  {visible.map((r) => (
                    <tr
                      key={r.symbol}
                      className="border-b border-paper/[0.07] transition-colors duration-200 hover:bg-paper/[0.03]"
                    >
                      <td className="py-3 pr-6">
                        <Link
                          href={`/research/${encodeURIComponent(r.symbol)}`}
                          className="group block"
                        >
                          <span className="tabular text-[0.8rem] text-gold transition-colors duration-300 group-hover:text-gold-bright">
                            {r.symbol}
                          </span>
                          {/* Wraps rather than truncating. "ExxonMobil
                              Holdings Corporation" and "Commonwealth Bank
                              of Australia" both overflow 26 characters,
                              and an ellipsis in the identity column of a
                              research tool hides the one field the reader
                              is scanning for. */}
                          <span className="mt-0.5 block max-w-[30ch] text-[0.82rem] font-light leading-snug text-paper-dim transition-colors duration-300 group-hover:text-paper">
                            {r.name ?? DASH}
                          </span>
                          <span className="mt-0.5 block text-[0.58rem] uppercase tracking-[0.16em] text-stone-dim">
                            {r.market}
                            {r.sector ? ` · ${r.sector}` : ""}
                            {r.heldIn ? " · Held" : ""}
                          </span>
                        </Link>
                      </td>
                      <Num>{r.price === null ? DASH : decimal(r.price)}</Num>
                      <td className="tabular py-3 pl-4 text-right text-[0.82rem]">
                        <Change value={r.changePercent} />
                      </td>
                      <Num>{fmtCap(r.marketCap, null)}</Num>
                      <Num>{multiple(r.trailingPE, 1)}</Num>
                      <td className="tabular hidden py-3 pl-4 text-right text-[0.82rem] text-paper-dim lg:table-cell">
                        {multiple(r.priceToBook, 1)}
                      </td>
                      <Num>{percent(r.dividendYield, 2)}</Num>
                    </tr>
                  ))}
                  {range.paddingBottom > 0 ? (
                    <tr aria-hidden="true" style={{ height: range.paddingBottom }}>
                      <td colSpan={COLUMNS.length} />
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {/* ── Phone: reorganised into cards, not a shrunken table ──
                A seven-column financial table on a 375px screen is either
                a horizontal scroll nobody discovers or type nobody can
                read. Each company becomes a card with the identity on top
                and the figures as labelled pairs beneath, which is the
                same information in the order a phone reader wants it. */}
            <ul className="space-y-3 md:hidden">
              {range.paddingTop > 0 ? (
                <li aria-hidden="true" style={{ height: range.paddingTop }} />
              ) : null}
              {visible.map((r) => (
                <li key={r.symbol}>
                  <Link
                    href={`/research/${encodeURIComponent(r.symbol)}`}
                    className="block border border-paper/12 p-4 transition-colors duration-300 hover:border-gold/40"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="tabular text-[0.8rem] text-gold">
                        {r.symbol}
                      </span>
                      <span className="tabular text-[0.9rem] text-paper">
                        {r.price === null ? DASH : decimal(r.price)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between gap-3">
                      <span className="max-w-[22ch] text-[0.82rem] font-light leading-snug text-paper-dim">
                        {r.name ?? DASH}
                      </span>
                      <span className="tabular text-[0.75rem]">
                        <Change value={r.changePercent} />
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-paper/10 pt-3">
                      {[
                        ["Cap", fmtCap(r.marketCap, null)],
                        ["P/E", multiple(r.trailingPE, 1)],
                        ["Yield", percent(r.dividendYield, 2)],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-[0.55rem] uppercase tracking-[0.16em] text-stone-dim">
                            {label}
                          </dt>
                          <dd className="tabular mt-1 text-[0.78rem] text-paper-dim">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 text-[0.55rem] uppercase tracking-[0.16em] text-stone-dim">
                      {r.market}
                      {r.sector ? ` · ${r.sector}` : ""}
                      {r.heldIn ? " · Held" : ""}
                    </p>
                  </Link>
                </li>
              ))}
              {range.paddingBottom > 0 ? (
                <li aria-hidden="true" style={{ height: range.paddingBottom }} />
              ) : null}
            </ul>

            </div>

            {/* The whole result, not a page of it.
                Paging hid the size of what a filter returned: fifty rows
                and a page control left the reader doing arithmetic to
                learn they had matched three hundred companies. */}
            <p className="mt-6 border-t border-paper/10 pt-5 text-[0.65rem] tracking-wide text-stone-dim">
              {rows.length.toLocaleString("en-AU")}{" "}
              {rows.length === 1 ? "company" : "companies"} in this result
              {data && rows.length !== data.rows.length
                ? ` of ${data.rows.length.toLocaleString("en-AU")} covered`
                : ""}
              {rows.length > visible.length
                ? ` · ${visible.length} rendered, the rest mount as you scroll`
                : ""}
            </p>

            <p className="mt-8 max-w-[86ch] text-[0.65rem] leading-[1.85] text-stone-dim">
              An em dash means the figure is not published by the data
              provider for that company — most often because the company has
              no trailing earnings, so no price-to-earnings ratio exists. It
              is never a zero, and companies without a figure are excluded
              from filters on it rather than passed through.
              {data && data.quotedCount < data.rows.length
                ? ` ${(data.rows.length - data.quotedCount).toLocaleString("en-AU")} constituent(s) returned no quote from the feed on this request; they are listed with their figures unavailable rather than removed.`
                : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ── small pieces ─────────────────────────────────────────────────── */

function Num({ children }: { children: React.ReactNode }) {
  return (
    <td className="tabular py-3 pl-4 text-right text-[0.82rem] text-paper-dim">
      {children}
    </td>
  );
}

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-stone-dim">{DASH}</span>;
  return (
    <span className={value >= 0 ? "text-gold" : "text-ice"}>
      {signedPercent(value)}
    </span>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block w-full lg:w-auto">
      <span className="mb-2 block text-[0.58rem] uppercase tracking-[0.22em] text-stone">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-paper/15 bg-ink px-3 py-3 text-[0.85rem] text-paper focus:border-gold/50 focus:outline-none sm:py-2 lg:w-auto"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-ink">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block w-full lg:w-28">
      <span className="mb-2 block text-[0.58rem] uppercase tracking-[0.22em] text-stone">
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-paper/15 bg-ink px-3 py-3 text-[0.85rem] text-paper placeholder:text-stone-dim focus:border-gold/50 focus:outline-none sm:py-2"
      />
    </label>
  );
}
