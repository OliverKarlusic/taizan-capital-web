import Reveal from "@/components/animations/Reveal";
import { ArrowUpRight } from "lucide-react";
import { BY_STRATEGY } from "@/data/byStrategy";

/**
 * Performance, on the homepage.
 *
 * This section used to key off QUARTERS and render "No quarter has closed"
 * — which stayed true of quarterly reporting and became false of the site,
 * because real results were published on strategy pages while the homepage
 * went on saying there were none. A visitor who read only the homepage was
 * told the opposite of what the site actually held.
 *
 * It now shows the results that exist, drawn from the same source as the
 * Performance page so the two can never disagree, and says plainly that
 * quarterly reporting has not started. Those are different claims and the
 * page makes both.
 */

const FUNDED = BY_STRATEGY.filter((s) => s.result !== null);

export default function Insights() {
  return (
    <section
      id="insights"
      aria-labelledby="insights-title"
      className="relative z-10 scroll-mt-28 bg-ink-soft py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
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
              <p className="mt-7 max-w-[54ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
                Results are published for the strategies that have run,
                measured against a stated benchmark and reconciled against
                broker records first. Where a strategy has trailed its
                benchmark, the gap is shown rather than described.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <a
                href="/performance"
                className="group mt-9 inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.24em] text-gold transition-colors duration-500 hover:text-gold-bright"
              >
                Full results and methodology
                <ArrowUpRight
                  size={14}
                  strokeWidth={1.5}
                  className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            </Reveal>
          </div>

          <Reveal delay={0.15} className="lg:col-span-6">
            <div className="h-full border-t border-paper/12 pt-8 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-0">
              {FUNDED.map((s) => (
                <a
                  key={s.name}
                  href={s.href ?? "/performance"}
                  className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-paper/10 py-5 first:pt-0"
                >
                  <span className="text-[0.95rem] font-light text-paper-dim transition-colors duration-500 group-hover:text-paper">
                    {s.name}
                    <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.18em] text-stone-dim">
                      {s.since}
                    </span>
                  </span>
                  <span className="tabular font-serif text-2xl text-paper">
                    {s.result}
                  </span>
                </a>
              ))}
              <p className="mt-6 max-w-[46ch] text-[0.72rem] font-light leading-[1.85] text-stone">
                Measured on different bases against different benchmarks, and
                deliberately not combined into a firm-level figure. Taizan
                Capital has issued no quarterly report and publishes no
                fund-level track record.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
