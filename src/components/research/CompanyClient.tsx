"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { CompanyPayload } from "@/app/api/research/company/[ticker]/route";
import { Unavailable } from "@/components/research/TerminalChrome";
import PriceChart from "@/components/research/PriceChart";
import { marketDate, marketDateTime, sessionDate } from "@/lib/research/clock";
import { marketSession } from "@/lib/research/session";
import { conversionNote, convert } from "@/lib/research/fx";
import ThesisEditor from "@/components/research/ThesisEditor";
import {
  cashConversion,
  cashConversionCycle,
  currentRatio,
  dio,
  dpo,
  dso,
  effectiveTaxRate,
  fcfMargin,
  freeCashFlow,
  interestCoverage,
  investedCapital,
  netDebtToEbitda,
  nopat,
  quickRatio,
  returnOnAssets,
  returnOnEquity,
  roic,
  seriesCagr,
  shareCountChange,
} from "@/lib/research/fundamentals";
import {
  DASH,
  decimal,
  multiple,
  fraction,
  marketCap as fmtCap,
  percent,
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

import {
  DETAIL_TABS,
  TABS,
  UNAVAILABLE,
  isFund,
  type DetailPayload,
  type DistributionView,
  type EstimatePeriodView,
  type TabId,
} from "@/components/research/companyTypes";

export default function CompanyClient({ symbol }: { symbol: string }) {
  const [data, setData] = useState<CompanyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  /**
   * Show live figures in AUD instead of the listing's own currency.
   *
   * Off by default: the native currency is what the security actually
   * trades in, and a converted price is a derived figure. The reader
   * opts into the derivation rather than having to notice it.
   */
  const [inAud, setInAud] = useState(false);
  /** When this page's figures were retrieved, for the as-of stamp. */
  const [fetchedAt, setFetchedAt] = useState<string>(() => new Date().toISOString());

  /* The second request, made only once one of its tabs is opened. */
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [detailState, setDetailState] = useState<"idle" | "loading" | "error">("idle");

  /**
   * Which symbol's detail has been requested.
   *
   * A ref rather than state, and there is deliberately no cleanup
   * function here. The first version guarded on `detailState` and listed
   * it as a dependency: setting it to "loading" re-ran the effect, whose
   * cleanup set `alive = false`, so the response that arrived 400ms later
   * was discarded and the panel loaded forever. Staleness is checked
   * against the symbol at resolve time instead, which is the thing that
   * actually makes a response stale.
   */
  const requestedRef = useRef<string | null>(null);
  const needsDetail = DETAIL_TABS.has(tab);

  useEffect(() => {
    if (!needsDetail || requestedRef.current === symbol) return;
    requestedRef.current = symbol;
    setDetailState("loading");
    (async () => {
      try {
        const r = await fetch(
          `/api/research/company/${encodeURIComponent(symbol)}/detail`,
        );
        const j = await r.json();
        if (requestedRef.current !== symbol) return; // a different company now
        if (!r.ok) setDetailState("error");
        else {
          setDetail(j);
          setDetailState("idle");
        }
      } catch {
        if (requestedRef.current === symbol) setDetailState("error");
      }
    })();
  }, [needsDetail, symbol]);

  // A new company means the previous company's statements must go.
  useEffect(() => {
    requestedRef.current = null;
    setDetail(null);
    setDetailState("idle");
    setTab("overview");
  }, [symbol]);

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

  // A fund is not an issuer, so the issuer-only sections are not offered
  // rather than offered and then apologised for.
  /**
   * Whether this listing's market is trading right now.
   *
   * Computed client-side from the current instant, so it is correct for
   * whenever the reader is looking rather than for whenever the page
   * was built. Null for an exchange with no calendar configured, in
   * which case the generic delayed notice stands — an unknown session
   * is not the same claim as a closed one.
   */
  const session = marketSession(data.symbol, new Date(fetchedAt));

  /**
   * Conversion is offered only where there is a rate to convert at.
   *
   * An AUD-listed security has none and needs none. A failed FX fetch
   * also lands here, and the page then shows native currency with no
   * toggle — which is the honest outcome, rather than a control that
   * converts at a rate the page does not have.
   */
  const fx = data.fxToAud;
  const showAud = inAud && !!fx;
  const displayCurrency = showAud ? "AUD" : (quote.currency ?? "");
  /** Live quote figures only — see fx.ts on why statements are excluded. */
  const px = (v: number | null) => (showAud ? convert(v, fx) : v);

  const fund = isFund(quote.quoteType);
  const visibleTabs = TABS.filter((t) => !(fund && t.issuer));

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
                {px(quote.price) === null ? DASH : decimal(px(quote.price)!)}
                <span className="ml-2 text-[0.8rem] tracking-wide text-stone">
                  {displayCurrency}
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
                {/* Three separate facts, and none replaces another:
                    when this was fetched, whether the market is
                    trading, and that the feed is delayed. The session
                    state tells the reader whether the number is still
                    moving; the delay notice stays regardless, because a
                    price during an open session is delayed too. */}
                As of {marketDateTime(fetchedAt)}
                {session ? ` · ${session.label}` : ""} · delayed feed
              </p>

              {fx ? (
                <>
                  <button
                    type="button"
                    aria-pressed={showAud}
                    onClick={() => setInAud((v) => !v)}
                    className={`mt-2 inline-flex min-h-11 items-center text-[0.6rem] uppercase tracking-[0.16em] transition-colors ${
                      showAud ? "text-gold" : "text-stone hover:text-paper"
                    }`}
                  >
                    {showAud
                      ? `Showing AUD · switch to ${quote.currency}`
                      : "Show in AUD"}
                  </button>
                  {/* The basis, whenever a converted figure is on screen.
                      A converted number is only as current as the rate
                      behind it, so the rate and its quote time are named
                      rather than left implicit. */}
                  {showAud ? (
                    <p className="mt-1 max-w-[34ch] text-[0.58rem] leading-relaxed tracking-wide text-stone-dim">
                      {conversionNote(fx)}. Statements stay in{" "}
                      {quote.currency} — today&apos;s rate does not apply to a
                      figure reported years ago.
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {/* Watchlist and thesis, where the reader is already looking at
              the security rather than on a separate screen. */}
          <ThesisEditor
            symbol={data.symbol}
            name={quote.name}
            market={data.market}
            securityType={quote.quoteType}
            metrics={{
              price: quote.price,
              trailingPE: f.trailingPE,
              priceToBook: f.priceToBook,
              dividendYield: f.dividendYield,
              marketCap: quote.marketCap,
              revenueGrowth: f.revenueGrowth,
              profitMargins: f.profitMargins,
              returnOnEquity: f.returnOnEquity,
              volatility1y: risk.volatility1y,
              maxDrawdown1y: risk.maxDrawdown1y,
            }}
          />

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
          {/* The full tabs pattern, because the roles were already
              claiming it.

              This declared role="tab" on thirteen buttons and stopped
              there: no tabpanel, no aria-controls, no ids, no roving
              tabindex. A screen reader therefore announced "tab, 1 of
              13" — which tells the user to press arrow keys — and the
              arrow keys did nothing, because nothing handled them. The
              roles promised an interaction the markup had not built, so
              a keyboard user was worse off than if these had stayed
              plain buttons.

              Arrows move and select in one step (automatic activation),
              which is the right choice where switching costs nothing:
              every panel is already loaded or loads on demand. Home and
              End jump to the ends. Only the selected tab is in the page
              tab order, so Tab enters the strip once and leaves it
              once. */}
          <div
            role="tablist"
            aria-label={fund ? "Fund sections" : "Company sections"}
            className="flex flex-wrap gap-x-1"
            onKeyDown={(e) => {
              const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
              if (!keys.includes(e.key)) return;
              e.preventDefault();
              const i = visibleTabs.findIndex((v) => v.id === tab);
              const last = visibleTabs.length - 1;
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? last
                    : e.key === "ArrowRight"
                      ? (i + 1) % visibleTabs.length
                      : (i - 1 + visibleTabs.length) % visibleTabs.length;
              const id = visibleTabs[next].id;
              setTab(id);
              document.getElementById(`tab-${id}`)?.focus();
            }}
          >
            {visibleTabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls="company-panel"
                  tabIndex={active ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-3 py-3 text-[0.62rem] uppercase tracking-[0.16em] transition-colors duration-300 sm:px-4 sm:text-[0.65rem] sm:tracking-[0.18em] ${
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

      {/* ── Panels ──
          One panel element for all thirteen tabs, relabelled as the
          selection changes. The alternative — thirteen panels with
          twelve hidden — would ship every section's markup on every
          view for no gain, since only one is ever rendered here anyway.

          tabIndex={-1} makes it programmatically focusable without
          entering the tab order: several panels open on a paragraph
          with nothing focusable in it, and a panel a screen-reader user
          can move to is the difference between hearing the new section
          and hearing nothing after pressing an arrow key. */}
      <div
        id="company-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        tabIndex={-1}
        className="mx-auto max-w-[110rem] px-6 py-10 lg:px-10"
      >
        {/* Said once, on the section the reader lands on. A fund missing
            eight tabs with no explanation reads as a broken page; the
            reason is structural and takes one sentence. */}
        {fund && tab === "overview" ? (
          <p className="mb-8 max-w-[76ch] text-[0.72rem] leading-[1.9] text-stone-dim">
            This is a fund rather than an operating company. Statement,
            profitability, quality, peer and ownership sections are not
            shown for it — a fund files no income statement, earns no
            return on invested capital and has no insider register, so
            those figures do not exist to be retrieved. Price, risk,
            calendar and news are drawn from the same feed as everywhere
            else.
          </p>
        ) : null}

        {fund && tab === "overview" && data.fund ? (
          <FundPanel fund={data.fund} currency={quote.currency} />
        ) : null}

        {tab === "overview" && data.history?.length > 1 ? (
          <PriceChart
            symbol={data.symbol}
            currency={quote.currency}
            low={quote.fiftyTwoWeekLow}
            high={quote.fiftyTwoWeekHigh}
            initial={{
              points: data.history,
              observations: data.historyObservations,
              exchangeTimezone: data.exchangeTimezone,
            }}
          />
        ) : null}

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
                  ["Market cap", fmtCap(px(quote.marketCap), displayCurrency), "marketCap"],
                  ["Trailing P/E", multiple(f.trailingPE, 1), "trailingPE"],
                  ["Forward P/E", multiple(f.forwardPE, 1), "forwardPE"],
                  ["Price / book", multiple(f.priceToBook, 1), "priceToBook"],
                  ["Dividend yield", percent(f.dividendYield, 2), "dividendYield"],
                  ["EPS (trailing)", f.eps === null ? DASH : decimal(f.eps)],
                  ["52-week low", px(quote.fiftyTwoWeekLow) === null ? DASH : decimal(px(quote.fiftyTwoWeekLow)!), "fiftyTwoWeekRange"],
                  ["52-week high", px(quote.fiftyTwoWeekHigh) === null ? DASH : decimal(px(quote.fiftyTwoWeekHigh)!), "fiftyTwoWeekRange"],
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
                  {/* A yield of zero is a real answer — the company pays no
                      dividend — so this row is not treated as a multiple,
                      where zero would render N/M. */}
                  <ValuationRow
                    label="Dividend yield %"
                    value={f.dividendYield}
                    peer={peers.dividendYield.value}
                    count={peers.dividendYield.count}
                    kind="rate"
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
                  ["PEG ratio", multiple(f.pegRatio, 2)],
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
                  ["Gross margin", fraction(f.grossMargins), "grossMargin"],
                  ["Operating margin", fraction(f.operatingMargins), "operatingMargin"],
                  ["Net margin", fraction(f.profitMargins), "netMargin"],
                  ["Return on equity", fraction(f.returnOnEquity), "roe"],
                  ["Return on assets", fraction(f.returnOnAssets), "roa"],
                  ["Debt / equity", f.debtToEquity === null ? DASH : decimal(f.debtToEquity, 1), "debtToEquity"],
                  ["Current ratio", f.currentRatio === null ? DASH : decimal(f.currentRatio), "currentRatio"],
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
                  ["Beta", risk.beta === null ? DASH : decimal(risk.beta), "beta"],
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

        {DETAIL_TABS.has(tab) ? (
          detailState === "loading" ? (
            <p className="py-12 text-[0.85rem] text-stone">
              Fetching delayed market data…
            </p>
          ) : detailState === "error" || !detail ? (
            <div className="border border-dashed border-paper/15 px-6 py-12">
              <p className="max-w-[62ch] text-[0.9rem] font-light leading-[1.9] text-paper-dim">
                This section&apos;s data could not be retrieved. Nothing is
                estimated in its place — reload to try the feed again.
              </p>
            </div>
          ) : (
            <DetailPanel
              tab={tab}
              d={detail}
              currency={detail.currency ?? quote.currency}
              symbol={data.symbol}
            />
          )
        ) : null}

        {!TABS.find((t) => t.id === tab)?.live ? (
          <Unavailable {...UNAVAILABLE[tab]} />
        ) : null}
      </div>
    </div>
  );
}


/* ── detail panels ────────────────────────────────────────────────── */

import {
  H,
  Metric,
  MetricsGrid,
  Pair,
  StatementTable,
  StatementsUnavailable,
  ValuationRow,
  big,
  INCOME_ROWS,
} from "@/components/research/primitives";
function DetailPanel({
  tab,
  d,
  currency,
  symbol,
}: {
  tab: TabId;
  d: DetailPayload;
  currency: string | null;
  symbol: string;
}) {
  const st = d.statements;
  const stCurrency = st?.income?.[0]?.currency ?? currency;

  if (tab === "balance") {
    if (!st?.balance?.length) return <StatementsUnavailable coverage={st?.coverage ?? "not-configured"} />;
    return (
      <div>
        <H>Balance sheet</H>
        <p className="mt-4 max-w-[80ch] text-[0.82rem] font-light leading-[1.9] text-stone">
          Annual periods as filed, most recent first. Reported by {st.source};
          figures are as filed and have not been restated or adjusted here.
        </p>
        <StatementTable
          periods={st.balance}
          currency={stCurrency}
          rows={[
            ["Cash and equivalents", "cashAndCashEquivalents"],
            ["Short-term investments", "shortTermInvestments"],
            ["Receivables", "netReceivables"],
            ["Inventory", "inventory"],
            ["Total current assets", "totalCurrentAssets"],
            ["Property, plant & equipment", "propertyPlantEquipmentNet"],
            ["Goodwill", "goodwill"],
            ["Intangible assets", "intangibleAssets"],
            ["Total assets", "totalAssets"],
            ["Payables", "accountPayables"],
            ["Short-term debt", "shortTermDebt"],
            ["Total current liabilities", "totalCurrentLiabilities"],
            ["Long-term debt", "longTermDebt"],
            ["Total liabilities", "totalLiabilities"],
            ["Total equity", "totalStockholdersEquity"],
            ["Total debt", "totalDebt"],
            ["Net debt", "netDebt"],
          ]}
        />
      </div>
    );
  }

  if (tab === "cashflow") {
    if (!st?.cashFlow?.length) return <StatementsUnavailable coverage={st?.coverage ?? "not-configured"} />;
    return (
      <div>
        <H>Cash flow statement</H>
        <p className="mt-4 max-w-[80ch] text-[0.82rem] font-light leading-[1.9] text-stone">
          Annual periods as filed, most recent first. Reported by {st.source}.
          Capital expenditure is shown as reported, which is negative.
        </p>
        <StatementTable
          periods={st.cashFlow}
          currency={stCurrency}
          rows={[
            ["Net income", "netIncome"],
            ["Depreciation & amortisation", "depreciationAndAmortization"],
            ["Stock-based compensation", "stockBasedCompensation"],
            ["Change in working capital", "changeInWorkingCapital"],
            ["Operating cash flow", "netCashProvidedByOperatingActivities"],
            ["Capital expenditure", "capitalExpenditure"],
            ["Acquisitions, net", "acquisitionsNet"],
            ["Investing activities", "netCashUsedForInvestingActivities"],
            ["Share repurchases", "commonStockRepurchased"],
            ["Dividends paid", "dividendsPaid"],
            ["Financing activities", "netCashUsedProvidedByFinancingActivities"],
            ["Free cash flow", "freeCashFlow"],
          ]}
        />
      </div>
    );
  }

  if (tab === "quality") {
    if (!st?.income?.length || !st?.balance?.length || !st?.cashFlow?.length) {
      return <StatementsUnavailable coverage={st?.coverage ?? "not-configured"} />;
    }
    return <QualityPanel st={st} />;
  }

  if (tab === "financials") {
    if (!d.income.length) {
      return (
        <Unavailable
          title="Income statement"
          reason="The feed returned no income-statement periods for this listing."
        />
      );
    }
    return (
      <div>
        <H>Income statement</H>
        <p className="mt-4 max-w-[80ch] text-[0.82rem] font-light leading-[1.9] text-stone">
          Annual periods as reported by the data provider, most recent first.
          Figures are as filed and have not been restated or adjusted here.
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-paper/15">
                <th scope="col" className="py-3 text-[0.58rem] font-medium uppercase tracking-[0.2em] text-stone">
                  Period ending
                </th>
                {d.income.map((p) => (
                  <th
                    key={p.endDate ?? Math.random()}
                    scope="col"
                    className="tabular py-3 pl-6 text-right text-[0.58rem] font-medium uppercase tracking-[0.2em] text-stone"
                  >
                    {p.endDate ?? DASH}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Only lines the provider actually reports. Twelve rows of
                  em dashes with two figures buried in them is not a
                  statement, it is a list of things that are missing. */}
              {INCOME_ROWS.filter(([, key]) =>
                d.income.some((p) => p[key] !== null),
              ).map(([label, key]) => (
                <tr key={label} className="border-b border-paper/[0.07]">
                  <th scope="row" className="py-3 pr-6 text-left text-[0.8rem] font-normal text-paper-dim">
                    {label}
                  </th>
                  {d.income.map((p, i) => (
                    <td key={i} className="tabular py-3 pl-6 text-right text-[0.85rem] text-paper">
                      {big(p[key] as number | null, currency)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The absence is stated here rather than left to be discovered on
            another tab, because a reader looking at "Financials" reasonably
            expects three statements and is getting one. */}
        <p className="mt-6 max-w-[86ch] text-[0.68rem] leading-[1.85] text-stone-dim">
          Only the lines the provider reports are listed. Most of the
          statement is returned emptied — cost of revenue, gross profit,
          operating income and EBIT arrive as a zero with no formatted
          value, which is the provider&apos;s marker for a stripped field
          rather than a figure the company reported. Those lines are omitted
          rather than shown as zero. Balance-sheet and cash-flow periods
          come back the same way, which is why neither has a tab, and
          nothing here is reconstructed from the figures that did arrive.
        </p>
      </div>
    );
  }

  if (tab === "peers") {
    if (!d.peers.length) {
      return (
        <Unavailable
          title="Sector cohort"
          reason="No other covered constituent shares this company's sector, so there is no cohort to show."
        />
      );
    }
    return (
      <div>
        <H>Sector cohort</H>
        <p className="mt-4 max-w-[80ch] text-[0.82rem] font-light leading-[1.9] text-stone">
          The covered constituents closest to {symbol} by market
          capitalisation that share its{" "}
          {d.peerBasis.sector ? `${d.peerBasis.sector} ` : ""}sector, as
          classified by the index that lists them. This is a sector-and-size
          cohort drawn from this terminal&apos;s coverage — not a judgement
          that these businesses are comparable, and not a ranking.
        </p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-paper/15">
                {["Company", "Market cap", "P/E", "P/B", "Yield"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`py-3 text-[0.58rem] font-medium uppercase tracking-[0.2em] text-stone ${
                      i === 0 ? "" : "pl-6 text-right"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.peers.map((p) => (
                <tr key={p.symbol} className="border-b border-paper/[0.07]">
                  <td className="py-3 pr-6">
                    <Link href={`/research/${encodeURIComponent(p.symbol)}`} className="group block">
                      <span className="tabular text-[0.8rem] text-gold group-hover:text-gold-bright">
                        {p.symbol}
                      </span>
                      <span className="mt-0.5 block max-w-[30ch] text-[0.8rem] font-light leading-snug text-paper-dim">
                        {p.name ?? DASH}
                      </span>
                    </Link>
                  </td>
                  <td className="tabular py-3 pl-6 text-right text-[0.85rem] text-paper-dim">
                    {big(p.marketCap, null)}
                  </td>
                  <td className="tabular py-3 pl-6 text-right text-[0.85rem] text-paper-dim">
                    {multiple(p.trailingPE, 1)}
                  </td>
                  <td className="tabular py-3 pl-6 text-right text-[0.85rem] text-paper-dim">
                    {multiple(p.priceToBook, 1)}
                  </td>
                  <td className="tabular py-3 pl-6 text-right text-[0.85rem] text-paper-dim">
                    {percent(p.dividendYield, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tab === "ownership") {
    const o = d.ownership;
    const hasAny =
      o.insidersPercentHeld !== null ||
      o.institutionsPercentHeld !== null ||
      o.topHolders.length > 0;
    if (!hasAny) {
      return (
        <Unavailable
          title="Ownership"
          reason="The provider publishes no ownership breakdown for this listing."
        />
      );
    }
    return (
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          <H>Ownership breakdown</H>
          <MetricsGrid
            items={[
              ["Held by institutions", fraction(o.institutionsPercentHeld)],
              ["Held by insiders", fraction(o.insidersPercentHeld)],
              [
                "Institutions on register",
                o.institutionsCount === null
                  ? DASH
                  : Math.round(o.institutionsCount).toLocaleString("en-AU"),
              ],
            ]}
          />
          {o.insiders.length ? (
            <>
              <h3 className="mt-10 text-[0.62rem] uppercase tracking-[0.22em] text-stone">
                Recent insider transactions
              </h3>
              <ul className="mt-4">
                {o.insiders.slice(0, 6).map((h, i) => (
                  <li key={i} className="border-t border-paper/10 py-3">
                    <p className="text-[0.82rem] text-paper-dim">{h.name}</p>
                    <p className="mt-1 text-[0.68rem] text-stone">
                      {[h.relation, h.transaction, h.date].filter(Boolean).join(" · ") || DASH}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <div className="lg:col-span-7">
          <H>Largest institutional holders</H>
          {o.topHolders.length ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-paper/15">
                    {["Holder", "Held", "Position", "Value", "As at"].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={`py-3 text-[0.58rem] font-medium uppercase tracking-[0.2em] text-stone ${
                          i === 0 ? "" : "pl-5 text-right"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {o.topHolders.map((h, i) => (
                    <tr key={i} className="border-b border-paper/[0.07]">
                      <td className="py-3 pr-5 text-[0.82rem] text-paper-dim">{h.organization}</td>
                      <td className="tabular py-3 pl-5 text-right text-[0.82rem] text-paper">{fraction(h.pctHeld, 2)}</td>
                      <td className="tabular py-3 pl-5 text-right text-[0.82rem] text-paper-dim">{big(h.position, null)}</td>
                      <td className="tabular py-3 pl-5 text-right text-[0.82rem] text-paper-dim">{big(h.value, d.currency)}</td>
                      <td className="tabular py-3 pl-5 text-right text-[0.75rem] text-stone">{h.reportDate ?? DASH}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-6 text-[0.85rem] text-stone">
              No institutional register is published for this listing.
            </p>
          )}
          <p className="mt-6 max-w-[80ch] text-[0.68rem] leading-[1.85] text-stone-dim">
            Holder positions are reported on a lag and are as at the date
            shown against each line, not as at today.
          </p>
        </div>
      </div>
    );
  }

  if (tab === "calendar") {
    const c = d.calendar;
    const est = d.estimates ?? [];
    const dist = d.distributions ?? [];
    if (
      !c.earningsDate &&
      !c.exDividendDate &&
      !c.dividendDate &&
      !est.length &&
      !dist.length
    ) {
      return (
        <Unavailable
          title="Calendar"
          reason="No reporting or dividend dates are published for this listing."
        />
      );
    }
    return (
      <div className="max-w-3xl">
        <H>Upcoming dates</H>
        <MetricsGrid
          items={[
            [
              c.earningsDateIsEstimate
                ? "Next results (provider estimate)"
                : "Next results (confirmed)",
              c.earningsDate ?? DASH,
            ],
            ["Ex-dividend date", c.exDividendDate ?? DASH],
            ["Dividend payable", c.dividendDate ?? DASH],
          ]}
        />
        {/* An estimated date presented as confirmed is exactly the kind of
            small false precision that costs a reader trust in everything
            beside it, so the distinction is on the label itself. */}
        <p className="mt-6 max-w-[80ch] text-[0.68rem] leading-[1.85] text-stone-dim">
          {c.earningsDateIsEstimate
            ? "The results date is the provider's estimate, not a date confirmed by the company, and is labelled as such above."
            : "The results date is reported by the provider as confirmed."}{" "}
          Dates should be checked against the company&apos;s own announcements
          before being relied on.
        </p>

        {est.length ? <Estimates rows={est} /> : null}
        {dist.length ? (
          <Distributions rows={dist} tz={d.distributionsTimezone ?? null} />
        ) : null}
      </div>
    );
  }

  if (tab === "filings") {
    return (
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <H>Recent coverage</H>
          {d.news.length ? (
            <ul className="mt-6">
              {d.news.map((n, i) => (
                <li key={i} className="border-t border-paper/10 py-4">
                  <a
                    href={n.link}
                    target="_blank"
                    rel="noreferrer"
                    className="group block"
                  >
                    <p className="max-w-[62ch] text-[0.88rem] font-light leading-snug text-paper-dim transition-colors duration-300 group-hover:text-paper">
                      {n.title}
                    </p>
                    <p className="mt-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-stone-dim">
                      {[n.publisher, n.published ? marketDate(n.published) : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-[0.85rem] text-stone">
              No recent items are returned for this listing.
            </p>
          )}
          <p className="mt-6 max-w-[70ch] text-[0.68rem] leading-[1.85] text-stone-dim">
            Headlines are listed with their publisher and link out to the
            source. Taizan Capital does not author, endorse or verify them,
            and their presence here is not a view on the company. Items
            whose headline is phrased as a recommendation — &ldquo;stocks to
            buy&rdquo;, price targets, upgrades and downgrades — are
            excluded, because this terminal does not publish
            recommendations and surfacing someone else&apos;s would not
            change that.
          </p>
        </div>

        <div className="lg:col-span-5">
          <H>Regulatory filings</H>
          {d.filings.length ? (
            <ul className="mt-6">
              {d.filings.map((f, i) => (
                <li key={i} className="border-t border-paper/10 py-3">
                  <a
                    href={f.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="group block"
                  >
                    <p className="tabular text-[0.7rem] uppercase tracking-[0.14em] text-gold">
                      {f.type} · {f.date}
                    </p>
                    <p className="mt-1 max-w-[42ch] text-[0.8rem] font-light leading-snug text-paper-dim group-hover:text-paper">
                      {f.title}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            /* The filings endpoint is SEC-backed and 404s for ASX lines.
               Saying so is more useful than an empty list, which would
               read as "this company has filed nothing". */
            <p className="mt-6 max-w-[46ch] text-[0.82rem] font-light leading-[1.9] text-stone">
              The filings feed behind this terminal covers SEC filers only,
              so nothing is listed for this company. That is a limit of the
              source, not a statement that no filings exist — ASX
              announcements are published on the ASX platform.
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Financial quality: the ratios a full statement set makes possible.
 *
 * Every figure is computed by src/lib/research/fundamentals.ts, which
 * returns null wherever an input is missing rather than substituting a
 * proxy. So a blank here means the arithmetic could not be done from
 * reported figures — never that it was done with an assumption.
 */
function QualityPanel({ st }: { st: NonNullable<DetailPayload["statements"]> }) {
  const inc = st.income!;
  const bal = st.balance!;
  const cf = st.cashFlow!;
  const i = inc[0];
  const b = bal[0];
  const c = cf[0];
  const years = inc.length - 1;

  const pct = (v: number | null, p = 1) => (v === null ? DASH : fraction(v, p));
  const x = (v: number | null, p = 2) => (v === null ? DASH : decimal(v, p));
  const days = (v: number | null) => (v === null ? DASH : `${Math.round(v)} days`);

  return (
    <div>
      <H>Financial quality</H>
      <p className="mt-4 max-w-[80ch] text-[0.82rem] font-light leading-[1.9] text-stone">
        Calculated from the statements as filed, for the period ending{" "}
        {i.date ?? DASH}. Return on invested capital uses the effective tax
        rate the company actually bore, not a statutory assumption, and
        invested capital is debt plus equity less cash. Where an input is not
        reported the ratio is left blank rather than estimated.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-3">
        <div>
          <h3 className="text-[0.62rem] uppercase tracking-[0.22em] text-stone">
            Returns on capital
          </h3>
          <MetricsGrid
            columns={2}
            items={[
              ["Return on invested capital", pct(roic(i, b)), "roic"],
              ["Return on equity", pct(returnOnEquity(i, b)), "roe"],
              ["Return on assets", pct(returnOnAssets(i, b)), "roa"],
              ["Effective tax rate", pct(effectiveTaxRate(i))],
              ["NOPAT", big(nopat(i), i.currency)],
              ["Invested capital", big(investedCapital(b), i.currency)],
            ]}
          />
        </div>

        <div>
          <h3 className="text-[0.62rem] uppercase tracking-[0.22em] text-stone">
            Cash and leverage
          </h3>
          <MetricsGrid
            columns={2}
            items={[
              ["Free cash flow", big(freeCashFlow(c), i.currency), "freeCashFlow"],
              ["FCF margin", pct(fcfMargin(c, i))],
              ["Cash conversion", pct(cashConversion(c)), "cashConversion"],
              ["Net debt / EBITDA", x(netDebtToEbitda(i, b)), "netDebtToEbitda"],
              ["Current ratio", x(currentRatio(b)), "currentRatio"],
              ["Quick ratio", x(quickRatio(b)), "quickRatio"],
              ["Interest coverage", x(interestCoverage(i), 1), "interestCoverage"],
            ]}
          />
        </div>

        <div>
          <h3 className="text-[0.62rem] uppercase tracking-[0.22em] text-stone">
            Working capital & growth
          </h3>
          <MetricsGrid
            columns={2}
            items={[
              ["Days sales outstanding", days(dso(i, b))],
              ["Days inventory", days(dio(i, b))],
              ["Days payable", days(dpo(i, b))],
              ["Cash conversion cycle", days(cashConversionCycle(i, b)), "cashConversionCycle"],
              [
                `Revenue CAGR (${years}y)`,
                pct(seriesCagr(inc.map((p) => p.revenue))),
              ],
              [
                `Net income CAGR (${years}y)`,
                pct(seriesCagr(inc.map((p) => p.netIncome))),
              ],
              ["Share count change", pct(shareCountChange(inc))],
            ]}
          />
        </div>
      </div>

      <p className="mt-10 max-w-[86ch] text-[0.68rem] leading-[1.85] text-stone-dim">
        A compound growth rate is shown only where both endpoints are
        positive — a move from a loss to a profit is a change of sign, not a
        rate, and reporting a percentage for it would be arithmetic without
        meaning. The cash conversion cycle requires all three of its
        components; two of them would be a different measure under the same
        name. Source: {st.source}.
      </p>
    </div>
  );
}

/* ── small pieces ─────────────────────────────────────────────────── */

function FundPanel({
  fund,
  currency,
}: {
  fund: NonNullable<CompanyPayload["fund"]>;
  currency: string | null;
}) {
  const rows: ([string, string] | [string, string, string])[] = [
    ["Issuer", fund.issuer ?? DASH],
    ["Category", fund.category ?? DASH],
    ["Net assets", fmtCap(fund.netAssets, currency), "netAssets"],
    ["NAV", fund.navPrice === null ? DASH : decimal(fund.navPrice)],
    ["Distribution yield", percent(fund.yield === null ? null : fund.yield * 100, 2)],
    [
      "Expense ratio",
      fund.expenseRatio === null
        ? DASH
        : percent(fund.expenseRatio * 100, 2),
    ],
    ["Inception", fund.inceptionDate ?? DASH],
  ];

  return (
    <section className="mb-12">
      <h2 className="text-[0.62rem] uppercase tracking-[0.26em] text-gold">
        Fund facts
      </h2>

      <dl className="mt-5 grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([k, v, def]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-4 border-b border-paper/[0.07] pb-2"
          >
            <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-stone">
              <Metric label={k} definition={def} />
            </dt>
            <dd className="tabular text-right text-[0.85rem] text-paper-dim">
              {v}
            </dd>
          </div>
        ))}
      </dl>

      {fund.expenseRatio === null ? (
        <p className="mt-4 max-w-[74ch] text-[0.68rem] leading-[1.8] text-stone-dim">
          The expense ratio is shown as unavailable because the data feed
          reports zero for this fund, and no fund operates at zero cost.
          The published figure is in the fund&apos;s PDS or factsheet.
          Nothing is estimated in its place.
        </p>
      ) : null}

      {fund.holdings.length ? (
        <div className="mt-9">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h3 className="text-[0.62rem] uppercase tracking-[0.2em] text-stone">
              Largest holdings
            </h3>
            <p className="text-[0.62rem] tracking-wide text-stone-dim">
              {fund.holdingsReturned} returned by the feed
              {fund.holdingsCoverage !== null
                ? ` · covering ${(fund.holdingsCoverage * 100).toFixed(1)}% of the portfolio`
                : ""}
              {" · not the full register"}
            </p>
          </div>

          <ul className="mt-4">
            {fund.holdings.map((h) => (
              <li
                key={`${h.symbol}-${h.name}`}
                className="flex items-baseline justify-between gap-4 border-b border-paper/[0.07] py-2"
              >
                <span className="min-w-0 text-[0.82rem] font-light text-paper-dim">
                  {h.symbol ? (
                    <Link
                      href={`/research/${encodeURIComponent(h.symbol)}`}
                      className="text-gold hover:text-gold-bright"
                    >
                      {h.symbol}
                    </Link>
                  ) : null}
                  {h.symbol && h.name ? " · " : ""}
                  {h.name ?? ""}
                </span>
                <span className="tabular shrink-0 text-[0.82rem] text-paper">
                  {h.weight === null ? DASH : percent(h.weight * 100, 2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {fund.sectorWeights.length ? (
        <div className="mt-9">
          <h3 className="text-[0.62rem] uppercase tracking-[0.2em] text-stone">
            Sector exposure
          </h3>
          <ul className="mt-4 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            {fund.sectorWeights.map((s) => (
              <li
                key={s.sector}
                className="flex items-baseline justify-between gap-4 border-b border-paper/[0.07] py-2"
              >
                <span className="text-[0.8rem] font-light capitalize text-paper-dim">
                  {s.sector.replace(/_/g, " ")}
                </span>
                <span className="tabular text-[0.8rem] text-paper">
                  {s.weight === null ? DASH : percent(s.weight * 100, 1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Consensus estimates, with the spread and the count behind them.
 *
 * ── WHY THE RANGE AND THE COUNT ARE NOT OPTIONAL ────────────────────
 * A single consensus figure invites the reader to treat it as a fact.
 * The low and the high say how much the people producing it disagree,
 * and the analyst count says how many there are — an estimate from
 * three analysts and one from forty are different objects, and only the
 * count distinguishes them. The average alone would be the most
 * confident-looking and least informative version of this panel.
 *
 * ── WHY THESE PERIODS ARE DATED IN THE FUTURE ───────────────────────
 * They are estimates; that is what an estimate is. On a terminal where
 * a future date was a real defect, the distinction has to be explicit
 * rather than inferred, so the copy says these are forecasts and every
 * period carries the date it runs to.
 *
 * ── AND WHAT IS NOT HERE ────────────────────────────────────────────
 * The provider publishes a consensus recommendation and a mean price
 * target alongside these. Neither is fetched. Those are the verdict,
 * and reaching the verdict is the reader's job.
 */
function Estimates({ rows }: { rows: EstimatePeriodView[] }) {
  const label = (p: string) =>
    p === "0q"
      ? "Current quarter"
      : p === "+1q"
        ? "Next quarter"
        : p === "0y"
          ? "Current year"
          : p === "+1y"
            ? "Next year"
            : p;

  const HEADS = ["Period", "Ends", "EPS estimate", "EPS range", "Revenue", "Analysts"];

  return (
    <section className="mt-14">
      <H>Analyst expectations</H>
      <p className="mt-3 max-w-[80ch] text-[0.72rem] leading-[1.85] text-stone-dim">
        Consensus estimates collected by the data provider for periods not
        yet reported. These are forecasts rather than results, and the
        range shows how far the contributing analysts disagree. No
        recommendation or price target is published here.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-paper/15">
              {HEADS.map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={`py-3 text-[0.58rem] font-medium uppercase tracking-[0.2em] text-stone ${
                    i > 1 ? "pl-4 text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.period} className="border-b border-paper/[0.07]">
                <td className="py-3 pr-4 text-[0.82rem] text-paper-dim">
                  {label(r.period)}
                </td>
                <td className="py-3 pr-4 text-[0.82rem] text-stone">
                  {r.endDate ?? DASH}
                </td>
                <td className="tabular py-3 pl-4 text-right text-[0.85rem] text-paper">
                  {r.epsAvg === null ? DASH : decimal(r.epsAvg)}
                </td>
                <td className="tabular py-3 pl-4 text-right text-[0.8rem] text-stone">
                  {r.epsLow === null || r.epsHigh === null
                    ? DASH
                    : `${decimal(r.epsLow)} – ${decimal(r.epsHigh)}`}
                </td>
                <td className="tabular py-3 pl-4 text-right text-[0.82rem] text-paper-dim">
                  {fmtCap(r.revenueAvg, r.currency)}
                </td>
                <td className="tabular py-3 pl-4 text-right text-[0.82rem] text-stone">
                  {r.epsAnalysts === null ? DASH : r.epsAnalysts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Distributions actually paid, newest first.
 *
 * ── PAID, NOT DECLARED ──────────────────────────────────────────────
 * Anything dated after now is filtered upstream. A dividend announced
 * but not yet gone ex has not been paid, and listing it among history
 * would say that it had — the same rule the price series follows,
 * applied to the other place this terminal shows dated events.
 *
 * Amounts are as-paid per share in the listing currency. No total-return
 * figure is derived from them: doing that properly needs a reinvestment
 * assumption stated on screen, and an unstated one is a number the
 * reader cannot check.
 */
function Distributions({
  rows,
  tz,
}: {
  rows: DistributionView[];
  tz: string | null;
}) {
  const years = new Map<number, number>();
  for (const r of rows) {
    // Grouped by the exchange's calendar year, matching the session-date
    // rule used everywhere else on this page.
    const y = Number(
      new Intl.DateTimeFormat("en-AU", {
        timeZone: tz ?? "Australia/Sydney",
        year: "numeric",
      }).format(new Date(r.date * 1000)),
    );
    years.set(y, (years.get(y) ?? 0) + r.amount);
  }
  const byYear = [...years.entries()].sort((a, b) => b[0] - a[0]);

  return (
    <section className="mt-14">
      <H>Distribution history</H>
      <p className="mt-3 max-w-[80ch] text-[0.72rem] leading-[1.85] text-stone-dim">
        Distributions that have gone ex, newest first, per share in the
        listing currency. Announced but unpaid distributions are not
        listed. No total-return figure is derived from these, because that
        needs a reinvestment assumption this terminal does not make on the
        reader&apos;s behalf.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-x-14 gap-y-8 lg:grid-cols-2">
        <div>
          <h4 className="text-[0.6rem] uppercase tracking-[0.2em] text-stone">
            By year
          </h4>
          <ul className="mt-3">
            {byYear.map(([y, total]) => (
              <li
                key={y}
                className="flex items-baseline justify-between gap-4 border-b border-paper/[0.07] py-2"
              >
                <span className="tabular text-[0.82rem] text-paper-dim">{y}</span>
                <span className="tabular text-[0.82rem] text-paper">
                  {decimal(total)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[0.6rem] uppercase tracking-[0.2em] text-stone">
            Individual payments
          </h4>
          <ul className="mt-3 max-h-[22rem] overflow-y-auto pr-2">
            {rows.map((r) => (
              <li
                key={r.date}
                className="flex items-baseline justify-between gap-4 border-b border-paper/[0.07] py-2"
              >
                <span className="text-[0.8rem] font-light text-stone">
                  {sessionDate(r.date, tz)}
                </span>
                <span className="tabular text-[0.82rem] text-paper-dim">
                  {decimal(r.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
