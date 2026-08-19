"use client";

/**
 * The panels behind the detail tabs.
 *
 * ── WHY THESE ARE A SEPARATE, LAZILY LOADED MODULE ──────────────────
 * Statements, quality, estimates and distributions are ~660 lines that
 * render on eight tabs of thirteen, and every one of those tabs already
 * waits on a second network request before it can show anything. So the
 * code was being shipped to every reader on first load to serve a view
 * none of them had asked for yet, and which could not paint immediately
 * even when they did.
 *
 * Loading it on demand costs nothing the reader was not already waiting
 * for, and takes it out of the first-load bundle for everyone who opens
 * a company and reads the overview.
 */

import Link from "next/link";
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
  fraction,
  marketCap as fmtCap,
  multiple,
  percent,
} from "@/lib/research/format";
import { marketDate, sessionDate } from "@/lib/research/clock";
import { Unavailable } from "@/components/research/TerminalChrome";
import {
  H,
  INCOME_ROWS,
  MetricsGrid,
  StatementTable,
  StatementsUnavailable,
  big,
} from "@/components/research/primitives";
import {
  type DetailPayload,
  type DistributionView,
  type EstimatePeriodView,
  type TabId,
} from "@/components/research/companyTypes";

export default function DetailPanel({
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