import Reveal from "@/components/animations/Reveal";
import { ArrowDownToLine } from "lucide-react";
import { PERFORMANCE, REPORTS, hasPerformance, hasReports } from "@/lib/reports";

/**
 * Performance & Insights.
 *
 * This section previously carried a synthetic market-sentiment chart and a
 * set of article cards with invented titles and dates — design-phase
 * filler on a page whose entire purpose is evidence. All of it is gone.
 *
 * What stands here now is the reporting architecture itself: the table
 * that will hold performance, the list that will hold quarterly reports,
 * and an honest statement that neither has anything in it yet.
 *
 * That is a deliberate choice. An investor looking for a track record
 * learns more from a manager who shows the shape of its reporting and says
 * "nothing yet" than from one who fills the space with commentary. The
 * empty table is the disclosure.
 */

const PERIODS = ["Quarter", "1 year", "Since inception"] as const;

export default function Insights() {
  return (
    <section
      id="insights"
      aria-labelledby="insights-title"
      className="relative z-10 scroll-mt-28 bg-ink-soft py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <Reveal>
            <p className="overline-label mb-6">05 — Performance &amp; Insights</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              id="insights-title"
              className="font-serif text-[clamp(1.9rem,4vw,3.1rem)] font-medium leading-[1.16] text-paper"
            >
              Evidence, when there is evidence.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-7 max-w-[62ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
              Taizan Capital reports quarterly. Each report will cover every
              portfolio&apos;s performance, the positioning behind it, and the
              reasoning for any material change. Nothing has been published
              yet — the fund is new, and a return is worth reading only once
              it has been reconciled.
            </p>
          </Reveal>
        </div>

        {/* ── Performance by portfolio ── */}
        <Reveal delay={0.15}>
          <div className="mt-20">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h3 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
                Performance by portfolio
              </h3>
              {!hasPerformance ? (
                <span className="text-[0.62rem] uppercase tracking-[0.2em] text-stone-dim">
                  No reporting periods closed
                </span>
              ) : null}
            </div>

            {/* Scrolls inside itself on narrow screens rather than widening
                the page — the table is the one element here that genuinely
                needs more width than a phone has. */}
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <caption className="sr-only">
                  Performance by portfolio. No figures are currently
                  published.
                </caption>
                <thead>
                  <tr className="border-b border-paper/15">
                    <th
                      scope="col"
                      className="py-4 pr-6 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-stone"
                    >
                      Portfolio
                    </th>
                    {PERIODS.map((p) => (
                      <th
                        key={p}
                        scope="col"
                        className="py-4 pl-6 text-right text-[0.62rem] font-medium uppercase tracking-[0.2em] text-stone"
                      >
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERFORMANCE.map((row) => (
                    <tr key={row.slug} className="border-b border-paper/10">
                      <th
                        scope="row"
                        className="py-5 pr-6 font-serif text-[1.05rem] font-normal text-paper"
                      >
                        {row.name}
                      </th>
                      {[row.quarter, row.oneYear, row.sinceInception].map(
                        (v, i) => (
                          <td
                            key={i}
                            className="tabular py-5 pl-6 text-right text-[0.9rem]"
                          >
                            {v ? (
                              <span className="text-paper">{v}</span>
                            ) : (
                              <span
                                className="text-stone-dim"
                                title="No reporting period closed"
                              >
                                &mdash;
                              </span>
                            )}
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 max-w-[74ch] text-[0.65rem] leading-relaxed tracking-wide text-stone-dim">
              A dash indicates no closed reporting period, not a zero return.
              Figures will be published net of fees against a stated
              benchmark, with the basis of calculation disclosed. Taizan
              Capital does not publish estimated, targeted, simulated or
              back-tested figures.
            </p>
          </div>
        </Reveal>

        {/* ── Quarterly reports ── */}
        <Reveal delay={0.2}>
          <div className="mt-20 border-t border-paper/10 pt-14">
            <h3 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
              Quarterly reports
            </h3>

            {hasReports ? (
              <ul className="mt-8">
                {REPORTS.map((r) => (
                  <li
                    key={r.id}
                    className="grid grid-cols-1 items-baseline gap-x-8 gap-y-2 border-b border-paper/10 py-6 sm:grid-cols-12"
                  >
                    <span className="tabular font-serif text-xl text-paper sm:col-span-2">
                      {r.label}
                    </span>
                    <span className="text-[0.82rem] font-light text-stone sm:col-span-4">
                      {r.period}
                    </span>
                    <span className="text-[0.82rem] font-light text-paper-dim sm:col-span-4">
                      {r.summary}
                    </span>
                    <span className="sm:col-span-2 sm:text-right">
                      {r.href ? (
                        <a
                          href={r.href}
                          className="group inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.22em] text-gold hover:text-gold-bright"
                        >
                          <ArrowDownToLine size={13} strokeWidth={1.5} />
                          PDF
                        </a>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              /* Honest empty state. Not a skeleton, not a "coming soon"
                 card pretending to be content — a plain statement of where
                 the firm is. */
              <div className="mt-8 border border-dashed border-paper/15 px-8 py-14 text-center">
                <p className="mx-auto max-w-[52ch] text-[0.95rem] font-light leading-[1.9] text-paper-dim">
                  No reports have been published.
                </p>
                <p className="mx-auto mt-4 max-w-[56ch] text-[0.82rem] font-light leading-[1.85] text-stone">
                  The first will follow the fund&apos;s first full quarter and
                  will be available here as a PDF, covering every portfolio.
                </p>
              </div>
            )}
          </div>
        </Reveal>

        {/* ── What a report contains ── */}
        <Reveal delay={0.25}>
          <div className="mt-20 border-t border-paper/10 pt-14">
            <h3 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
              What each report will contain
            </h3>
            <ul className="mt-10 grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Performance",
                  "Each portfolio's return for the quarter, twelve months and since inception, net of fees against a stated benchmark.",
                ],
                [
                  "Positioning",
                  "What the portfolios hold, how that has changed, and the concentration and exposure at quarter end.",
                ],
                [
                  "Commentary",
                  "The reasoning behind material decisions — what was bought, what was sold, and what was left alone.",
                ],
                [
                  "Market observations",
                  "Written when there is something worth saying, rather than to fill a quarterly slot.",
                ],
              ].map(([t, d]) => (
                <li key={t} className="border-t border-paper/12 pt-6">
                  <h4 className="font-serif text-lg text-paper">{t}</h4>
                  <p className="mt-3 max-w-[42ch] text-[0.8rem] font-light leading-[1.8] text-stone">
                    {d}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
