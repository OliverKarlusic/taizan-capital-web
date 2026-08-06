"use client";

import Reveal from "@/components/animations/Reveal";
import PortfolioGallery from "@/components/ui/portfolio-gallery";
import { DrawdownChart } from "@/components/charts/lazy";

const METRICS = [
  { value: "0.94", label: "Sharpe ratio" },
  { value: "6.8%", label: "Realised volatility" },
  { value: "−16%", label: "Deepest drawdown" },
  { value: "38", label: "Markets held" },
];

/**
 * Portfolio Management — the holdings gallery is the centrepiece, with the
 * institutional evidence (risk metrics, stress behaviour) beneath it. The
 * order is the argument: what we own, then how it behaves when tested.
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
              Six convictions, held across geographies and decades. Each is
              owned as a business rather than traded as a position — which is
              why the list changes slowly, and deliberately.
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
        <Reveal>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-10 border-y border-paper/10 py-10 lg:grid-cols-4">
            {METRICS.map((m) => (
              <div key={m.label}>
                <dt className="text-[0.62rem] uppercase tracking-[0.22em] text-stone">
                  {m.label}
                </dt>
                <dd className="tabular mt-3 font-serif text-4xl text-paper">
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-14">
            <DrawdownChart />
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-14 border-l border-gold/40 pl-6 font-serif text-xl italic leading-relaxed text-stone sm:text-2xl">
            “The first rule of compounding is to never interrupt it
            unnecessarily. The first rule of Taizan is to never make that
            possible.”
          </p>
        </Reveal>

        <p className="mt-10 text-[0.65rem] leading-relaxed tracking-wide text-stone-dim">
          Holdings shown are investment themes, not named securities. All
          returns, weightings and risk figures are illustrative and do not
          represent actual performance.
        </p>
      </div>
    </section>
  );
}
