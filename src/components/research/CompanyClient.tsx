"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { CompanyPayload } from "@/app/api/research/company/[ticker]/route";
import { Unavailable } from "@/components/research/TerminalChrome";
import {
  DASH,
  decimal,
  fraction,
  marketCap as fmtCap,
  percent,
  relativeTo,
  signedPercent,
} from "@/lib/research/format";

/**
 * A single company's research record.
 *
 * ── WHAT THE TABS ARE ───────────────────────────────────────────────
 * Four are live because the upstream carries them for both the ASX and
 * the US markets: Overview, Valuation, Growth & Profitability, Risk. Six
 * are not, and each says which source it is waiting on rather than
 * showing a spinner or a placeholder figure.
 *
 * ── THE LINE THIS FILE MUST NOT CROSS ───────────────────────────────
 * Every figure below is either fetched or arithmetic over fetched values,
 * and every comparison is expressed as a direction — above, below, in
 * line with. There is no score, no band, no colour that means "good", and
 * no sentence that tells the reader what to do. The Valuation tab in
 * particular shows the multiples and what they are being measured
 * against, and stops. A firm without a licence may publish what a number
 * is; it may not publish what the number means for you.
 */

const TABS = [
  { id: "overview", label: "Overview", live: true },
  { id: "valuation", label: "Valuation", live: true },
  { id: "growth", label: "Growth & Profitability", live: true },
  { id: "risk", label: "Risk", live: true },
  { id: "financials", label: "Financials", live: false },
  { id: "cashflow", label: "Cash Flow", live: false },
  { id: "peers", label: "Peers", live: false },
  { id: "ownership", label: "Ownership", live: false },
  { id: "filings", label: "News & Filings", live: false },
  { id: "calendar", label: "Calendar", live: false },
  { id: "thesis", label: "Thesis", live: false },
] as const;

type TabId = (typeof TABS)[number]["id"];

const UNAVAILABLE: Record<string, { title: string; reason: string }> = {
  financials: {
    title: "Full financial statements",
    reason:
      "Income statement, balance sheet and segment detail need a statements feed. The free tier behind this terminal returns summary ratios only, and reconstructing statements from ratios would produce figures that look sourced and are not.",
  },
  cashflow: {
    title: "Cash flow statement",
    reason:
      "Operating, investing and financing cash flows are not carried by the current feed. Free cash flow is the figure most worth having here, which is exactly why it will not be inferred from earnings and an assumed capital-expenditure rate.",
  },
  peers: {
    title: "Comparable company analysis",
    reason:
      "A true peer set needs a classification source and a defensible basis for choosing which companies belong in it. The Valuation tab shows a median across this terminal's own covered universe in the same sector, which is a narrower and clearly-labelled thing — not a comparables analysis.",
  },
  ownership: {
    title: "Ownership and substantial holders",
    reason:
      "Institutional and substantial-holder registers require a paid provider. SEC EDGAR covers US filers only and would leave every ASX company on this list blank, which is a worse outcome than showing nothing consistently.",
  },
  filings: {
    title: "News and regulatory filings",
    reason:
      "Announcements need a licensed news feed, and ASX company announcements are not freely redistributable. A partial feed covering only US filers would imply the ASX companies had made no announcements.",
  },
  calendar: {
    title: "Earnings calendar",
    reason:
      "Confirmed reporting dates require a corporate-actions provider. The current feed carries estimated dates for some companies, and an estimated earnings date presented as confirmed is the kind of small false precision that erodes trust in everything beside it.",
  },
  thesis: {
    title: "Investment thesis",
    reason:
      "Held for a later phase, and constrained when it arrives: it will describe how Taizan Capital reads a business — what the firm looks at and what it has concluded about its own holding — and it will not tell a reader what to do. A thesis that recommends is advice, and the firm is not licensed to give it. Nothing is drafted here in the meantime.",
  },
};

export default function CompanyClient({ symbol }: { symbol: string }) {
  const [data, setData] = useState<CompanyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  /** When this page's figures were retrieved, for the as-of stamp. */
  const [fetchedAt, setFetchedAt] = useState<string>(() => new Date().toISOString());

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const r = await fetch(
          `/api/research/company/${encodeURIComponent(symbol)}`,
        );
        const j = await r.json();
        if (!alive) return;
        if (!r.ok) setError(j.error ?? "Market data is unavailable.");
        else {
          setData(j);
          setFetchedAt(new Date().toISOString());
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
  }, [symbol]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[110rem] px-6 py-24 lg:px-10">
        <p className="text-[0.85rem] text-stone">
          Fetching delayed market data…
        </p>
        <p className="mt-3 max-w-[52ch] text-[0.72rem] leading-relaxed text-stone-dim">
          The data service sleeps when idle on its free tier, so the first
          request after a quiet period can take a few seconds.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-[110rem] px-6 py-16 lg:px-10">
        <Link
          href="/research"
          className="group inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.22em] text-stone hover:text-gold"
        >
          <ArrowLeft size={12} strokeWidth={1.5} /> Back to screener
        </Link>
        <div className="mt-8 border border-dashed border-paper/15 px-6 py-16 text-center">
          <p className="mx-auto max-w-[54ch] text-[0.95rem] font-light leading-[1.9] text-paper-dim">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const { quote, profile, fundamentals: f, risk, peers } = data;

  return (
    <div>
      {/* ── Masthead ── */}
      <div className="border-b border-paper/10 bg-ink-soft">
        <div className="mx-auto max-w-[110rem] px-6 py-8 lg:px-10">
          {/* min-h-11 with a matching negative margin: a 44px target that
              does not push the masthead down. */}
          <Link
            href="/research"
            className="group -my-3 inline-flex min-h-11 items-center gap-2 text-[0.62rem] uppercase tracking-[0.22em] text-stone transition-colors duration-300 hover:text-gold"
          >
            <ArrowLeft
              size={12}
              strokeWidth={1.5}
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />
            Back to screener
          </Link>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
            <div>
              <p className="tabular text-[0.7rem] uppercase tracking-[0.22em] text-gold">
                {data.symbol} · {data.market}
              </p>
              <h1 className="mt-2 font-serif text-[clamp(1.7rem,3.4vw,2.7rem)] font-medium leading-tight text-paper">
                {quote.name ?? data.symbol}
              </h1>
              <p className="mt-2 text-[0.7rem] uppercase tracking-[0.16em] text-stone-dim">
                {[profile.sector, profile.industry].filter(Boolean).join(" · ") ||
                  "Sector not reported"}
              </p>
            </div>

            <div className="text-right">
              <p className="tabular font-serif text-[clamp(1.8rem,3.6vw,2.8rem)] leading-none text-paper">
                {quote.price === null ? DASH : decimal(quote.price)}
                <span className="ml-2 text-[0.8rem] tracking-wide text-stone">
                  {quote.currency ?? ""}
                </span>
              </p>
              <p
                className={`tabular mt-2 text-[0.85rem] ${
                  (quote.changePercent ?? 0) >= 0 ? "text-gold" : "text-ice"
                }`}
              >
                {signedPercent(quote.changePercent)}
              </p>
              {/* Freshness beside the price, not in the footer. A reader
                  who sees a number this prominent needs to know in the
                  same glance that it is not a real-time one. */}
              <p className="mt-2 text-[0.6rem] uppercase tracking-[0.14em] text-stone-dim">
                As of{" "}
                {new Date(fetchedAt).toLocaleString("en-AU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · delayed, not real time
              </p>
            </div>
          </div>

          {/* A fact about the firm's own book, stated as one. */}
          {data.heldIn ? (
            <p className="mt-6 border-l-2 border-gold/40 py-1 pl-5 text-[0.72rem] font-light leading-[1.8] text-stone">
              Held in Taizan Capital&apos;s {data.heldIn} strategy. This
              records a position the firm holds. It is not a recommendation,
              and it is not a suggestion that this security is suitable for
              you.
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Tabs ──

          The strip wraps rather than scrolling sideways. Ten sections do
          not fit across a 375px phone, and an overflow-x container puts
          six of them — every unavailable one — behind a horizontal swipe
          most readers never try. Wrapping costs two extra rows of very
          small type and keeps all ten reachable and visible, which is what
          reorganising for mobile means as opposed to shrinking. */}
      <div className="border-b border-paper/10">
        <div className="mx-auto max-w-[110rem] px-6 lg:px-10">
          <div
            role="tablist"
            aria-label="Company sections"
            className="flex flex-wrap gap-x-1"
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`whitespace-nowrap border-b-2 px-3 py-3 text-[0.62rem] uppercase tracking-[0.16em] transition-colors duration-300 sm:px-4 sm:text-[0.65rem] sm:tracking-[0.18em] ${
                    active
                      ? "border-gold text-paper"
                      : "border-transparent text-stone hover:text-paper-dim"
                  }`}
                >
                  {t.label}
                  {!t.live ? (
                    <span className="ml-2 text-[0.55rem] normal-case tracking-normal text-stone-dim">
                      soon
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Panels ── */}
      <div className="mx-auto max-w-[110rem] px-6 py-10 lg:px-10">
        {tab === "overview" ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <H>Business</H>
              {profile.summary ? (
                <p className="mt-5 max-w-[78ch] text-[0.88rem] font-light leading-[1.9] text-paper-dim">
                  {profile.summary}
                </p>
              ) : (
                <p className="mt-5 text-[0.85rem] text-stone">
                  No business description is published by the data provider
                  for this company.
                </p>
              )}
              <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                <Pair label="Exchange" value={quote.exchange ?? DASH} />
                <Pair label="Country" value={profile.country ?? DASH} />
                <Pair
                  label="Employees"
                  value={
                    profile.employees === null
                      ? DASH
                      : profile.employees.toLocaleString("en-AU")
                  }
                />
              </dl>
            </div>

            <div className="lg:col-span-5">
              <H>Key figures</H>
              <MetricsGrid
                items={[
                  ["Market cap", fmtCap(quote.marketCap, quote.currency)],
                  ["Trailing P/E", f.trailingPE === null ? DASH : decimal(f.trailingPE, 1)],
                  ["Forward P/E", f.forwardPE === null ? DASH : decimal(f.forwardPE, 1)],
                  ["Price / book", f.priceToBook === null ? DASH : decimal(f.priceToBook, 1)],
                  ["Dividend yield", percent(f.dividendYield, 2)],
                  ["EPS (trailing)", f.eps === null ? DASH : decimal(f.eps)],
                  ["52-week low", quote.fiftyTwoWeekLow === null ? DASH : decimal(quote.fiftyTwoWeekLow)],
                  ["52-week high", quote.fiftyTwoWeekHigh === null ? DASH : decimal(quote.fiftyTwoWeekHigh)],
                ]}
              />
            </div>
          </div>
        ) : null}

        {tab === "valuation" ? (
          <div>
            <H>Valuation multiples</H>
            <p className="mt-4 max-w-[80ch] text-[0.82rem] font-light leading-[1.9] text-stone">
              The multiples this company currently trades on, and where each
              sits against the median of the {peers.sector ?? "same-sector"}{" "}
              companies this terminal covers. The comparison states a
              direction and a magnitude. It does not conclude anything about
              whether the price is warranted — that judgement is not
              published here.
            </p>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-paper/15">
                    {["Multiple", "This company", "Covered sector median", "Difference", ""].map(
                      (h, i) => (
                        <th
                          key={i}
                          scope="col"
                          className={`py-3 text-[0.58rem] font-medium uppercase tracking-[0.2em] text-stone ${
                            i === 0 ? "" : i === 4 ? "pl-6" : "pl-6 text-right"
                          }`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  <ValuationRow
                    label="Trailing P/E"
                    value={f.trailingPE}
                    peer={peers.trailingPE.value}
                    count={peers.trailingPE.count}
                  />
                  <ValuationRow
                    label="Price / book"
                    value={f.priceToBook}
                    peer={peers.priceToBook.value}
                    count={peers.priceToBook.count}
                  />
                  <ValuationRow
                    label="Dividend yield %"
                    value={f.dividendYield}
                    peer={peers.dividendYield.value}
                    count={peers.dividendYield.count}
                  />
                  <ValuationRow
                    label="EV / EBITDA"
                    value={f.enterpriseToEbitda}
                    peer={peers.enterpriseToEbitda.value}
                    count={peers.enterpriseToEbitda.count}
                  />
                  <ValuationRow label="Forward P/E" value={f.forwardPE} peer={null} count={0} />
                  <ValuationRow label="Price / sales" value={f.priceToSales} peer={null} count={0} />
                  <ValuationRow
                    label="EV / revenue"
                    value={f.enterpriseToRevenue}
                    peer={null}
                    count={0}
                  />
                </tbody>
              </table>
            </div>

            <p className="mt-6 max-w-[86ch] text-[0.68rem] leading-[1.85] text-stone-dim">
              &ldquo;Covered sector median&rdquo; is the median across the
              companies in this terminal&apos;s universe that share this
              company&apos;s sector — a few dozen large listed names, not the
              sector as a whole. It is shown only where at least three
              companies carry the figure. Where no median is shown, there
              were too few, or the multiple is not returned by the feed for
              peer companies.
            </p>
          </div>
        ) : null}

        {tab === "growth" ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <H>Growth</H>
              <MetricsGrid
                items={[
                  ["Revenue growth (yoy)", fraction(f.revenueGrowth)],
                  ["Earnings growth (yoy)", fraction(f.earningsGrowth)],
                  ["PEG ratio", f.pegRatio === null ? DASH : decimal(f.pegRatio)],
                ]}
              />
              <p className="mt-5 max-w-[62ch] text-[0.68rem] leading-[1.8] text-stone-dim">
                Growth rates are the data provider&apos;s most recent
                year-on-year figures. They describe what has happened and
                carry no implication about what follows.
              </p>
            </div>
            <div>
              <H>Profitability</H>
              <MetricsGrid
                items={[
                  ["Gross margin", fraction(f.grossMargins)],
                  ["Operating margin", fraction(f.operatingMargins)],
                  ["Net margin", fraction(f.profitMargins)],
                  ["Return on equity", fraction(f.returnOnEquity)],
                  ["Return on assets", fraction(f.returnOnAssets)],
                  ["Debt / equity", f.debtToEquity === null ? DASH : decimal(f.debtToEquity, 1)],
                  ["Current ratio", f.currentRatio === null ? DASH : decimal(f.currentRatio)],
                  ["Book value / share", f.bookValue === null ? DASH : decimal(f.bookValue)],
                ]}
              />
            </div>
          </div>
        ) : null}

        {tab === "risk" ? (
          <div>
            <H>Objective risk measures</H>
            <p className="mt-4 max-w-[80ch] text-[0.82rem] font-light leading-[1.9] text-stone">
              Measurements over the last twelve months of daily closing
              prices, plus the provider&apos;s beta. These describe how the
              price has behaved. They are not a risk rating and this terminal
              does not publish one.
            </p>
            <div className="mt-8 max-w-3xl">
              <MetricsGrid
                columns={2}
                items={[
                  ["Beta", risk.beta === null ? DASH : decimal(risk.beta)],
                  ["Realised volatility (1y, annualised)", percent(risk.volatility1y, 1)],
                  ["Maximum drawdown (1y, on closes)", percent(risk.maxDrawdown1y, 1)],
                  ["Price return (1y, excl. dividends)", signedPercent(risk.priceReturn1y, 1)],
                  [
                    "Position in 52-week range",
                    risk.rangePosition === null
                      ? DASH
                      : `${Math.round(risk.rangePosition)} of 100`,
                  ],
                  ["Observations used", String(risk.observations)],
                ]}
              />
            </div>
            <p className="mt-6 max-w-[86ch] text-[0.68rem] leading-[1.85] text-stone-dim">
              Volatility is the standard deviation of daily log returns
              scaled by the square root of 252 trading days. Maximum drawdown
              is the deepest peak-to-trough fall measured on closing prices,
              so the true intraday fall was at least this large. Both are
              computed from {risk.observations} observed closes; neither is
              shown where fewer than 30 were available.
            </p>
          </div>
        ) : null}

        {!TABS.find((t) => t.id === tab)?.live ? (
          <Unavailable {...UNAVAILABLE[tab]} />
        ) : null}
      </div>
    </div>
  );
}

/* ── small pieces ─────────────────────────────────────────────────── */

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[0.62rem] uppercase tracking-[0.26em] text-gold">
      {children}
    </h2>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.58rem] uppercase tracking-[0.18em] text-stone-dim">
        {label}
      </dt>
      <dd className="mt-1.5 text-[0.85rem] text-paper-dim">{value}</dd>
    </div>
  );
}

function MetricsGrid({
  items,
  columns = 2,
}: {
  items: [string, string][];
  columns?: number;
}) {
  return (
    <dl
      className={`mt-6 grid grid-cols-1 gap-x-10 ${
        columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
      }`}
    >
      {items.map(([label, value]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-6 border-b border-paper/10 py-3"
        >
          <dt className="text-[0.72rem] text-stone">{label}</dt>
          <dd className="tabular text-[0.9rem] text-paper">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ValuationRow({
  label,
  value,
  peer,
  count,
}: {
  label: string;
  value: number | null;
  peer: number | null;
  count: number;
}) {
  const direction = relativeTo(value, peer);
  const delta =
    value !== null && peer !== null && peer !== 0
      ? ((value - peer) / Math.abs(peer)) * 100
      : null;

  return (
    <tr className="border-b border-paper/[0.07]">
      <th
        scope="row"
        className="py-3 pr-6 text-left text-[0.8rem] font-normal text-paper-dim"
      >
        {label}
      </th>
      <td className="tabular py-3 pl-6 text-right text-[0.88rem] text-paper">
        {value === null ? DASH : decimal(value, 2)}
      </td>
      <td className="tabular py-3 pl-6 text-right text-[0.88rem] text-stone">
        {peer === null ? DASH : decimal(peer, 2)}
      </td>
      <td className="tabular py-3 pl-6 text-right text-[0.85rem] text-paper-dim">
        {delta === null ? DASH : signedPercent(delta, 0)}
      </td>
      {/* Two different absences, and the reader deserves to know which.
          A blank company figure means the provider does not publish this
          multiple for this company — usually because it has no earnings.
          A blank median means the covered universe cannot support one. */}
      <td className="py-3 pl-6 text-[0.72rem] text-stone">
        {direction !== null
          ? `${direction} the median of ${count} covered companies`
          : value === null
            ? "Not published for this company"
            : "No sector median available"}
      </td>
    </tr>
  );
}
