"use client";

import Reveal from "@/components/animations/Reveal";
import { ArrowUpRight } from "lucide-react";

const ARTICLES = [
  {
    category: "Market Commentary",
    date: "Q3 2026",
    title: "The Quiet Repricing of Duration",
    excerpt:
      "Rate expectations have normalised faster than positioning. We examine where patience is currently being paid, and where it is merely being tested.",
    readTime: "12 min",
  },
  {
    category: "Economic Analysis",
    date: "Q2 2026",
    title: "Japan's Balance Sheet Renaissance",
    excerpt:
      "Corporate governance reform is transforming capital efficiency across the Topix. A generational shift, moving at a deliberately Japanese pace.",
    readTime: "18 min",
  },
  {
    category: "Investment Letters",
    date: "Q2 2026",
    title: "On Holding Cash Without Apology",
    excerpt:
      "Ma — the deliberate interval — applied to portfolio construction. Why our cash allocation is a position, not an absence of one.",
    readTime: "9 min",
  },
];

export default function Insights() {
  return (
    <section
      id="insights"
      aria-labelledby="insights-title"
      className="relative z-10 bg-ink-soft py-28 sm:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal>
              <p className="overline-label mb-6">05 — Performance & Insights</p>
            </Reveal>
            <Reveal delay={0.1}>
              <h2
                id="insights-title"
                className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-medium leading-[1.14] text-paper"
              >
                Research, written to be
                <span className="italic text-gold-bright"> re-read</span>.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <a
              href="#contact"
              className="link-underline text-[0.7rem] font-medium uppercase tracking-[0.24em] text-gold"
            >
              Request the full library
            </a>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* This panel held a "composite market-sentiment oscillator
              across three full cycles" — 48 synthetic quarters labelled
              from Q1'14, invented market history presented as observed
              data. Removed. What stands here instead is the reporting
              architecture, stated honestly: the shape of what will be
              published, with nothing published yet. */}
          <Reveal className="lg:col-span-7" delay={0.1}>
            <div className="h-full border border-paper/10 bg-ink-soft p-8 sm:p-10">
              <h3 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
                Reporting
              </h3>
              <p className="mt-6 max-w-[52ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
                Taizan Capital intends to report quarterly. Each report will
                cover portfolio positioning, the reasoning behind material
                changes, and performance measured against a stated
                benchmark.
              </p>
              <ul className="mt-10 space-y-0">
                {[
                  ["Quarterly report", "Positioning, changes and commentary"],
                  ["Performance", "Measured, disclosed and benchmarked"],
                  ["Portfolio commentary", "What changed, and why"],
                  ["Market observations", "Written when there is something to say"],
                ].map(([t, d]) => (
                  <li
                    key={t}
                    className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 border-t border-paper/10 py-4"
                  >
                    <span className="text-[0.88rem] text-paper">{t}</span>
                    <span className="text-[0.75rem] font-light text-stone">
                      {d}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 border-t border-paper/10 pt-6 max-w-[52ch] text-[0.65rem] leading-relaxed text-stone-dim">
                No reports have been published. The first will follow the
                fund&apos;s first full quarter. Taizan Capital does not
                publish estimated, targeted or simulated figures.
              </p>
            </div>
          </Reveal>

          <div className="flex flex-col lg:col-span-5">
            {ARTICLES.map((a, i) => (
              <Reveal key={a.title} delay={0.15 + i * 0.08}>
                <a
                  href="#contact"
                  className="group block border-t border-paper/10 py-8 transition-colors duration-500 first:border-t-0 first:pt-0 hover:bg-paper/[0.02] lg:first:pt-2"
                >
                  <div className="flex items-center gap-4 text-[0.65rem] uppercase tracking-[0.22em]">
                    <span className="text-gold">{a.category}</span>
                    <span className="text-stone-dim">{a.date}</span>
                    <span className="text-stone-dim">{a.readTime}</span>
                  </div>
                  <h3 className="mt-3 flex items-start justify-between gap-4 font-serif text-2xl leading-snug text-paper transition-colors duration-500 group-hover:text-gold-bright">
                    {a.title}
                    <ArrowUpRight
                      size={18}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className="mt-1.5 shrink-0 text-stone opacity-0 transition-all duration-500 group-hover:translate-x-0.5 group-hover:text-gold group-hover:opacity-100"
                    />
                  </h3>
                  <p className="mt-3 text-sm font-light leading-[1.8] text-stone">
                    {a.excerpt}
                  </p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
