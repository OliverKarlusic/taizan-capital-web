/* eslint-disable @next/next/no-img-element -- the hero plate is a full-bleed
   background sized by CSS; next/image adds nothing here. */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CONVICTIONS, CONVICTION_BY_SLUG } from "@/lib/portfolio";
import Footer from "@/components/sections/Footer";
import AllocationBreakdown from "@/components/sections/AllocationBreakdown";
import Navbar from "@/components/ui/Navbar";

/**
 * Portfolio detail page.
 *
 * One route renders all five strategies from src/lib/portfolio.ts. Five
 * near-identical page files would drift apart within a month; a single
 * template cannot.
 *
 * Statically generated — the content is fixed copy, so there is nothing to
 * render per request.
 */

export function generateStaticParams() {
  return CONVICTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = CONVICTION_BY_SLUG[slug];
  if (!c) return { title: "Portfolio — Taizan Capital" };
  return {
    title: `${c.name} — Taizan Capital`,
    description: c.objective,
  };
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = CONVICTION_BY_SLUG[slug];
  if (!c) notFound();

  const others = CONVICTIONS.filter((x) => x.slug !== c.slug);

  return (
    <>
      <Navbar solid />
      <main id="main" className="relative bg-ink">
        {/* ── Masthead. The strategy's own plate, graded to the film. ── */}
        <header className="relative isolate flex min-h-[70vh] items-end overflow-hidden pb-16 pt-40 sm:min-h-[76vh] sm:pb-24">
          <img
            src={c.image}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover [filter:contrast(1.06)_saturate(0.76)_brightness(0.72)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 mix-blend-soft-light"
            style={{ backgroundColor: "rgba(198,166,100,0.16)" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.45) 38%, rgba(10,10,10,0.86) 100%)",
            }}
          />

          <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
            <Link
              href="/#portfolio"
              className="group inline-flex items-center gap-2.5 text-[0.62rem] uppercase tracking-[0.26em] text-stone transition-colors duration-500 hover:text-gold"
            >
              <ArrowLeft
                size={13}
                strokeWidth={1.5}
                className="transition-transform duration-500 group-hover:-translate-x-0.5"
              />
              All portfolios
            </Link>

            <p className="overline-label mt-10">{c.index} — Strategy</p>
            <h1 className="hero-legible mt-5 max-w-[18ch] font-serif text-[clamp(2.1rem,6vw,4.4rem)] font-medium leading-[1.08] text-paper">
              {c.name}
            </h1>
            <p className="hero-legible mt-7 max-w-[52ch] font-serif text-[clamp(1.05rem,2.2vw,1.5rem)] italic leading-snug text-paper-dim">
              {c.statement}
            </p>
          </div>
        </header>

        {/* ── Objective + key information ── */}
        <section className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:px-10">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
                Investment objective
              </h2>
              <p className="mt-6 max-w-[62ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
                {c.objective}
              </p>

              <h2 className="mt-16 text-[0.65rem] uppercase tracking-[0.28em] text-gold">
                Philosophy
              </h2>
              <p className="mt-6 max-w-[62ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
                {c.philosophy}
              </p>
            </div>

            {/* Key information. Every pending row is visibly pending — a
                placeholder that looks like data is worse than no data. */}
            <aside className="lg:col-span-5">
              <div className="border border-paper/12 bg-ink-soft p-7 sm:p-8">
                <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
                  Key information
                </h2>
                <dl className="mt-7 space-y-0">
                  {c.keyInfo.map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-paper/10 py-4 last:border-b-0"
                    >
                      <dt className="text-[0.72rem] uppercase tracking-[0.16em] text-stone">
                        {row.label}
                      </dt>
                      <dd
                        className={`tabular text-right text-[0.85rem] ${
                          row.pending
                            ? "italic text-stone-dim"
                            : "text-paper"
                        }`}
                      >
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-6 text-[0.62rem] leading-relaxed text-stone-dim">
                  No figure here has been set or offered. Taizan Capital is
                  not accepting external capital and does not publish
                  estimated, targeted or simulated figures.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* ── Approach ── */}
        <section className="border-t border-paper/10 bg-ink-soft">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-10">
            <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
              Investment approach
            </h2>
            <ol className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
              {c.approach.map((item, i) => (
                <li key={i} className="flex gap-6 border-t border-paper/10 pt-6">
                  <span className="tabular shrink-0 text-[0.6rem] uppercase tracking-[0.24em] text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="max-w-[54ch] text-[0.88rem] font-light leading-[1.85] text-paper-dim">
                    {item}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Risk ── */}
        <section className="border-t border-paper/10">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-10">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-5">
                <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
                  Risk profile
                </h2>
                <p className="mt-6 font-serif text-3xl text-paper">
                  {c.riskLevel}
                </p>
                <p className="mt-6 max-w-[54ch] text-[0.88rem] font-light leading-[1.9] text-paper-dim">
                  {c.riskNarrative}
                </p>
              </div>

              <ul className="lg:col-span-7">
                {c.riskFactors.map((f) => (
                  <li
                    key={f.name}
                    className="border-t border-paper/10 py-6 first:border-t-0 first:pt-0 lg:first:border-t lg:first:pt-6"
                  >
                    <h3 className="font-serif text-lg text-paper">{f.name}</h3>
                    <p className="mt-2 max-w-[62ch] text-[0.85rem] font-light leading-[1.85] text-stone">
                      {f.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Allocation is real, dated, broker-reported data and exists for
            exactly one strategy. It renders only there — a shared template
            must not imply the other four have a disclosed allocation. */}
        {c.slug === "growth-maximisation" ? <AllocationBreakdown /> : null}

        {/* ── Horizon, universe, suitability ── */}
        <section className="border-t border-paper/10 bg-ink-soft">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 sm:py-24 md:grid-cols-3 lg:px-10">
            {[
              { h: "Investment horizon", a: c.horizon, b: c.horizonNote },
              { h: "Asset universe", a: c.universeLabel, b: c.universe },
              { h: "Suitability", a: "Not for every investor", b: c.suitability },
            ].map((col) => (
              <div key={col.h} className="border-t border-paper/12 pt-6">
                <h2 className="text-[0.62rem] uppercase tracking-[0.26em] text-gold">
                  {col.h}
                </h2>
                <p className="mt-4 font-serif text-xl leading-snug text-paper">
                  {col.a}
                </p>
                <p className="mt-4 max-w-[46ch] text-[0.82rem] font-light leading-[1.85] text-stone">
                  {col.b}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── The other four ── */}
        <section className="border-t border-paper/10">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-10">
            <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
              Other strategies
            </h2>
            <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`/portfolios/${o.slug}`}
                    className="group block h-full border border-paper/12 p-6 transition-colors duration-500 hover:border-gold/40"
                  >
                    <p className="tabular text-[0.6rem] uppercase tracking-[0.24em] text-gold">
                      {o.index}
                    </p>
                    <h3 className="mt-3 font-serif text-lg leading-snug text-paper transition-colors duration-500 group-hover:text-gold-bright">
                      {o.name}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-16 max-w-[80ch] text-[0.65rem] leading-relaxed tracking-wide text-stone-dim">
              Nothing on this page constitutes financial product advice, an
              offer, or a solicitation, and it does not take account of your
              objectives, financial situation or needs. Taizan Capital does
              not hold an Australian Financial Services Licence and is not
              accepting external clients or capital; this page describes an
              investment approach and is not an offer of it. The firm&apos;s
              equity strategies are long-only and use no derivatives or
              leverage; its options strategy uses exchange-traded options
              and carries materially higher risk, including total loss of
              amounts committed to individual positions. Investing carries
              risk, including loss of capital.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
