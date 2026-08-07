"use client";

import Reveal from "@/components/animations/Reveal";
import PortfolioGallery from "@/components/ui/portfolio-gallery";

/**
 * Portfolio Management — five investment convictions on a circular gallery.
 *
 * Deliberately carries no returns, risk metrics or performance figures. The
 * section argues approach, not outcome, because no verified client
 * performance data exists yet to argue outcome with.
 */
export default function Portfolio() {
  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-title"
      className="relative z-10 bg-ink py-28 sm:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <Reveal>
            <p className="overline-label mb-6">04 — Portfolio Management</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              id="portfolio-title"
              className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-medium leading-[1.14] text-paper"
            >
              Preservation first.
              <span className="text-stone"> Growth follows.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-7 max-w-xl text-sm font-light leading-[1.9] text-paper-dim">
              Five convictions, each a way of owning rather than a product to
              buy. They differ in horizon and in temperament, not in
              discipline — and the list changes slowly, and deliberately.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Gallery breaks the grid — it wants the full width */}
      <Reveal delay={0.15}>
        <div className="mt-20 overflow-hidden">
          <PortfolioGallery />
        </div>
      </Reveal>

      <div className="mx-auto mt-24 max-w-7xl px-6 lg:px-10">
        <Reveal delay={0.15}>
          <p className="mt-14 border-l border-gold/40 pl-6 font-serif text-xl italic leading-relaxed text-stone sm:text-2xl">
            “The first rule of compounding is to never interrupt it
            unnecessarily. The first rule of Taizan is to never make that
            possible.”
          </p>
        </Reveal>

        <p className="mt-10 max-w-3xl text-[0.65rem] leading-relaxed tracking-wide text-stone-dim">
          The convictions above describe investment approach only. No
          returns, risk metrics or performance figures are shown anywhere in
          this section, and none should be inferred. Verified client
          performance data will be published separately, with its
          disclosures, once it exists.
        </p>
      </div>
    </section>
  );
}
