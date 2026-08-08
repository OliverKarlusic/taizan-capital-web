import Reveal from "@/components/animations/Reveal";
import { ArrowUpRight } from "lucide-react";
import {
  FUND_CUMULATIVE,
  LATEST,
  QUARTERS,
  REPORTING_CALENDAR,
  formatReturn,
  hasPerformance,
} from "@/lib/reports";

/**
 * Performance, on the homepage.
 *
 * This used to be the whole reporting surface — the full table, the report
 * list and the "what a report contains" grid, all rendering nothing. All of
 * that now lives on /performance, where it has room and where the
 * methodology sits beside it.
 *
 * What stays here is a summary: the commitment, the current position, and
 * a way through. A homepage section repeating an empty table at the reader
 * was using a lot of vertical space to say "nothing yet" slowly.
 *
 * Nothing here is hardcoded. Every figure and every empty state derives
 * from QUARTERS, so the day a real quarter is appended this section starts
 * showing it.
 */

export default function Insights() {
  return (
    <section
      id="insights"
      aria-labelledby="insights-title"
      className="relative z-10 scroll-mt-28 bg-ink-soft py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="overline-label mb-6">05 — Performance</p>
            </Reveal>
            <Reveal delay={0.1}>
              <h2
                id="insights-title"
                className="max-w-[16ch] font-serif text-[clamp(1.9rem,4vw,3.1rem)] font-medium leading-[1.16] text-paper"
              >
                Evidence, when there is evidence.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-7 max-w-[58ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
                Taizan Capital reports quarterly, on a calculation basis
                published before the first quarter closed. Returns are
                time-weighted, measured against a stated benchmark, and
                reconciled against broker records before anything appears
                here. Every quarter is published, including the poor ones.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <a
                href="/performance"
                className="group mt-9 inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.24em] text-gold transition-colors duration-500 hover:text-gold-bright"
              >
                Performance and methodology
                <ArrowUpRight
                  size={14}
                  strokeWidth={1.5}
                  className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            </Reveal>
          </div>

          {/* The current position, stated as a fact rather than a table of
              dashes. When a quarter closes this becomes the figure. */}
          {/* The column span belongs on the Reveal, not on the div inside
              it. Reveal is the grid child; with the span one level too deep
              this cell fell back to `auto` — 41px wide and 7346px tall,
              which also put it permanently below Reveal's 0.18 visibility
              threshold, so it never faded in. A tall invisible column reads
              as a blank gap rather than as broken text. */}
          <Reveal delay={0.15} className="lg:col-span-5">
            <div className="h-full border-t border-paper/12 pt-8 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-0">
              <p className="text-[0.62rem] uppercase tracking-[0.22em] text-stone">
                {hasPerformance ? "Since inception" : "Track record"}
              </p>

              {hasPerformance ? (
                <>
                  <p className="tabular mt-5 font-serif text-5xl text-paper">
                    {formatReturn(FUND_CUMULATIVE)}
                  </p>
                  <p className="mt-4 text-[0.82rem] font-light leading-[1.85] text-stone">
                    {QUARTERS.length}{" "}
                    {QUARTERS.length === 1 ? "quarter" : "quarters"} reported,
                    most recently {LATEST?.quarter.label}. Time-weighted, net
                    of all charges, in Australian dollars.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-5 font-serif text-3xl leading-tight text-paper">
                    No quarter has closed.
                  </p>
                  <p className="mt-5 text-[0.82rem] font-light leading-[1.85] text-stone">
                    Taizan Capital has published no performance figures and
                    none should be inferred from anything else on this site.
                    Quarters end {REPORTING_CALENDAR.quarterEnds}, and each
                    report follows {REPORTING_CALENDAR.publicationWindow}.
                  </p>
                  <p className="mt-5 text-[0.82rem] font-light leading-[1.85] text-stone">
                    A figure that has not been reconciled is not published,
                    however long that takes.
                  </p>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
