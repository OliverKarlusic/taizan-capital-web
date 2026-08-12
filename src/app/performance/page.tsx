import type { Metadata } from "next";
import { ArrowDownToLine } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/sections/Footer";
import { STATUS_LONG } from "@/lib/compliance";
import { readReportFiles } from "@/lib/report-files";
import { BY_STRATEGY } from "@/data/byStrategy";
import {
  BENCHMARK_CUMULATIVE,
  FUND_ANNUALISED,
  FUND_CUMULATIVE,
  METHODOLOGY,
  QUARTERS,
  REPORTING_CALENDAR,
  formatReturn,
  hasPerformance,
} from "@/lib/reports";

export const metadata: Metadata = {
  title: "Performance — Taizan Capital",
  description:
    "Quarterly performance, reports and the calculation basis they are produced on.",
};

/**
 * Performance.
 *
 * The page is built so that it is worth reading before any figure exists.
 * That is not a consolation for having no track record — it is the point.
 * The methodology is published now, while the results are unknown, so that
 * nobody can later suggest the flattering measure was chosen once the
 * outcome was visible. A manager who commits to a calculation basis in
 * advance is making a claim that a manager who publishes one alongside
 * good numbers cannot.
 *
 * Every empty state is derived from QUARTERS being empty, not hardcoded.
 * The day a real quarter is appended, the tables appear and the "nothing
 * yet" copy disappears without anyone editing this file.
 */

function Figure({ value }: { value: string }) {
  return <span className="tabular text-paper">{value}</span>;
}

function Empty() {
  return (
    <span className="text-stone-dim" title="No measurement for this period">
      &mdash;
    </span>
  );
}

export default function PerformancePage() {
  const quarterCount = QUARTERS.length;
  // Read from disk at build time, so publishing a report is dropping a
  // file in public/media/reports/ and nothing else.
  const reports = readReportFiles();

  return (
    <>
      <Navbar solid />
      <main id="main" className="relative bg-ink">
        {/* ── Header ── */}
        <section className="mx-auto max-w-6xl px-6 pb-14 pt-40 lg:px-10">
          <p className="overline-label">Reporting</p>
          <h1 className="mt-5 max-w-[20ch] font-serif text-[clamp(2rem,5vw,3.6rem)] font-medium leading-[1.1] text-paper">
            Performance
          </h1>
          <p className="mt-8 max-w-[64ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
            Taizan Capital reports quarterly. Each report covers every funded
            strategy&apos;s return for the quarter, the positioning behind it,
            and the reasoning for any material change. The calculation basis
            is published below and was set before the first quarter closed.
          </p>
          <p className="mt-6 max-w-[64ch] border-l-2 border-gold/40 py-1 pl-6 text-[0.78rem] font-light leading-[1.9] text-stone">
            {STATUS_LONG}
          </p>
        </section>

        {/* ── Headline ── */}
        <section className="border-t border-paper/10 bg-ink-soft">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
            <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
              Since inception
            </h2>
            {hasPerformance ? (
              <dl className="mt-10 grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-3">
                {[
                  ["Fund", formatReturn(FUND_CUMULATIVE)],
                  ["Benchmark", formatReturn(BENCHMARK_CUMULATIVE)],
                  [
                    "Annualised",
                    FUND_ANNUALISED === null
                      ? "Not yet twelve months"
                      : formatReturn(FUND_ANNUALISED),
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="border-t border-paper/12 pt-6">
                    <dt className="text-[0.62rem] uppercase tracking-[0.2em] text-stone">
                      {label}
                    </dt>
                    <dd className="tabular mt-3 font-serif text-3xl text-paper">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              /* Not a skeleton and not a "coming soon" card dressed up as
                 content — the actual position, stated once. */
              <div className="mt-8 max-w-[68ch]">
                <p className="text-[0.95rem] font-light leading-[1.95] text-paper-dim">
                  No reporting period has closed. Taizan Capital has published
                  no performance figures, and none should be inferred from
                  anything else on this website.
                </p>
                <p className="mt-5 text-[0.85rem] font-light leading-[1.9] text-stone">
                  Quarters end {REPORTING_CALENDAR.quarterEnds}. Each report
                  is published {REPORTING_CALENDAR.publicationWindow}, once
                  the quarter has been reconciled against broker and
                  custodian records. A figure that has not been reconciled is
                  not published, however long that takes.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Quarter by quarter ── */}
        {quarterCount > 0 ? (
          <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
            <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
              Fund, quarter by quarter
            </h2>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[38rem] border-collapse text-left">
                <caption className="sr-only">
                  Fund and benchmark return for each closed quarter.
                </caption>
                <thead>
                  <tr className="border-b border-paper/15">
                    <th
                      scope="col"
                      className="py-4 pr-6 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-stone"
                    >
                      Period
                    </th>
                    {QUARTERS.map((q) => (
                      <th
                        key={q.quarter.id}
                        scope="col"
                        className="py-4 pl-6 text-right text-[0.62rem] font-medium uppercase tracking-[0.2em] text-stone"
                      >
                        {q.quarter.label}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="py-4 pl-6 text-right text-[0.62rem] font-medium uppercase tracking-[0.2em] text-gold"
                    >
                      Cumulative
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "Fund",
                      series: QUARTERS.map((q) => q.fund),
                      total: FUND_CUMULATIVE,
                    },
                    {
                      name: "Benchmark",
                      series: QUARTERS.map((q) => q.benchmark),
                      total: BENCHMARK_CUMULATIVE,
                    },
                  ].map((row) => (
                    <tr key={row.name} className="border-b border-paper/10">
                      <th
                        scope="row"
                        className="py-5 pr-6 font-serif text-[1.05rem] font-normal text-paper"
                      >
                        {row.name}
                      </th>
                      {row.series.map((r, i) => (
                        <td
                          key={i}
                          className="py-5 pl-6 text-right text-[0.9rem]"
                        >
                          {r === null ? (
                            <Empty />
                          ) : (
                            <Figure value={formatReturn(r)} />
                          )}
                        </td>
                      ))}
                      <td className="py-5 pl-6 text-right text-[0.9rem]">
                        {row.total === null ? (
                          <Empty />
                        ) : (
                          <Figure value={formatReturn(row.total)} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* ── By strategy ──
            Driven by what each strategy has actually produced, not by the
            quarterly reporting cycle. Every result on this site lived on a
            strategy detail page behind the portfolio ring, so a visitor
            following the Performance link in the navigation arrived at an
            empty table and concluded nothing had been published. The
            results were real; the route to them was not. */}
        <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
          <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
            By strategy
          </h2>
          <p className="mt-8 max-w-[68ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
            Results exist for two strategies and a set of closed options
            positions. They are measured on different bases against
            different benchmarks and are not combined into a firm-level
            figure, because they are not one portfolio.
          </p>

          <div className="mt-10">
            {BY_STRATEGY.map((s) => (
              <div
                key={s.name}
                className="grid grid-cols-1 items-baseline gap-x-8 gap-y-3 border-t border-paper/10 py-7 sm:grid-cols-12"
              >
                <div className="sm:col-span-4">
                  {s.href ? (
                    <a
                      href={s.href}
                      className="link-underline font-serif text-[1.15rem] text-paper"
                    >
                      {s.name}
                    </a>
                  ) : (
                    <span className="font-serif text-[1.15rem] text-stone">
                      {s.name}
                    </span>
                  )}
                  <span className="mt-1 block text-[0.7rem] uppercase tracking-[0.16em] text-stone-dim">
                    {s.since}
                  </span>
                </div>

                <div className="sm:col-span-3">
                  {s.result ? (
                    <span className="tabular font-serif text-[1.5rem] text-paper">
                      {s.result}
                    </span>
                  ) : (
                    <span className="text-[0.85rem] italic text-stone-dim">
                      No capital allocated
                    </span>
                  )}
                </div>

                <div className="sm:col-span-5">
                  <p className="max-w-[46ch] text-[0.78rem] font-light leading-[1.8] text-stone">
                    {s.note}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-[78ch] text-[0.65rem] leading-relaxed tracking-wide text-stone-dim">
            No combined figure is shown. The strategies run different
            mandates against different benchmarks over different periods,
            and one of them reports realised trades rather than a portfolio
            return; adding them would produce a number that describes
            nothing. Each result is stated in full on its own page.
          </p>
        </section>

        {/* ── Reports ── */}
        <section className="border-t border-paper/10 bg-ink-soft">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
            <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
              Quarterly reports
            </h2>

            {reports.length > 0 ? (
              <ul className="mt-8">
                {reports.map((r) => (
                  <li
                    key={r.id}
                    className="grid grid-cols-1 items-baseline gap-x-8 gap-y-2 border-b border-paper/10 py-6 sm:grid-cols-12"
                  >
                    <span className="tabular font-serif text-xl text-paper sm:col-span-2">
                      {r.label}
                    </span>
                    <span className="text-[0.82rem] font-light text-stone sm:col-span-3">
                      {r.period}
                    </span>
                    <span className="text-[0.82rem] font-light text-paper-dim sm:col-span-5">
                      {r.summary ?? "Quarterly report."}
                    </span>
                    <span className="sm:col-span-2 sm:text-right">
                      <a
                        href={r.href}
                        download
                        className="group inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.22em] text-gold transition-colors duration-500 hover:text-gold-bright"
                      >
                        <ArrowDownToLine
                          size={13}
                          strokeWidth={1.5}
                          className="transition-transform duration-500 group-hover:translate-y-0.5"
                        />
                        PDF
                        <span className="tabular text-[0.62rem] normal-case tracking-normal text-stone-dim">
                          {r.size}
                        </span>
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-8 border border-dashed border-paper/15 px-8 py-14 text-center">
                <p className="mx-auto max-w-[52ch] text-[0.95rem] font-light leading-[1.9] text-paper-dim">
                  No reports have been published.
                </p>
                <p className="mx-auto mt-4 max-w-[58ch] text-[0.82rem] font-light leading-[1.85] text-stone">
                  The first will follow the fund&apos;s first full quarter
                  and will appear here as a downloadable PDF, covering every
                  funded strategy.
                </p>
              </div>
            )}

            <ul className="mt-14 grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Performance",
                  "Each funded strategy's return for the quarter and since inception, on the basis set out below, against the stated benchmark.",
                ],
                [
                  "Positioning",
                  "What the strategies hold, how that has changed, and the concentration and exposure at quarter end.",
                ],
                [
                  "Commentary",
                  "The reasoning behind material decisions — what was bought, what was sold, and what was left alone.",
                ],
                [
                  "Observations",
                  "Written when there is something worth saying, rather than to fill a quarterly slot.",
                ],
              ].map(([t, d]) => (
                <li key={t} className="border-t border-paper/12 pt-6">
                  <h3 className="font-serif text-lg text-paper">{t}</h3>
                  <p className="mt-3 max-w-[42ch] text-[0.8rem] font-light leading-[1.8] text-stone">
                    {d}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Methodology ── */}
        <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
          <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
            How these figures are calculated
          </h2>
          <p className="mt-8 max-w-[68ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
            This basis was set and published before the first quarter closed,
            so that the method cannot be chosen to suit a result. It applies
            to every figure on this page and in every report.
          </p>
          <dl className="mt-12">
            {METHODOLOGY.map((m) => (
              <div
                key={m.term}
                className="grid grid-cols-1 gap-x-10 gap-y-2 border-t border-paper/10 py-7 sm:grid-cols-12"
              >
                <dt className="text-[0.72rem] uppercase tracking-[0.18em] text-stone sm:col-span-4">
                  {m.term}
                </dt>
                <dd className="max-w-[68ch] text-[0.85rem] font-light leading-[1.9] text-paper-dim sm:col-span-8">
                  {m.body}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Legal ── */}
        <section className="border-t border-paper/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-10">
            <p className="max-w-[78ch] text-[0.7rem] leading-[1.9] tracking-wide text-stone-dim">
              Past performance is not an indicator of future performance, and
              no return shown or described on this page is promised,
              projected or guaranteed. Taizan Capital does not hold an
              Australian Financial Services Licence and is not accepting
              external clients or capital. Nothing on this page is an offer,
              a recommendation, or financial product advice, and it does not
              take account of your objectives, financial situation or needs.
              Investing carries risk, including loss of capital.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
