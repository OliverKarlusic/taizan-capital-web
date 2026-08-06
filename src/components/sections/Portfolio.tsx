"use client";

import Reveal from "@/components/animations/Reveal";
import TiltCard from "@/components/ui/TiltCard";
import { DrawdownChart } from "@/components/charts/lazy";
import { Globe2, Shield, Scale, Landmark } from "lucide-react";

const METRICS = [
  {
    icon: Shield,
    value: "0.94",
    label: "Sharpe ratio",
    caption: "Risk-adjusted efficiency across the composite mandate",
  },
  {
    icon: Scale,
    value: "6.8%",
    label: "Realised volatility",
    caption: "Roughly half of broad-equity volatility over the cycle",
  },
  {
    icon: Landmark,
    value: "−16%",
    label: "Deepest drawdown",
    caption: "Worst peak-to-trough loss across two decades of stress",
  },
  {
    icon: Globe2,
    value: "38",
    label: "Markets held",
    caption: "Diversified across developed and select emerging markets",
  },
];

const REGIONS = [
  { name: "North America", pct: 34 },
  { name: "Europe & UK", pct: 26 },
  { name: "Japan", pct: 18 },
  { name: "Asia-Pacific ex-Japan", pct: 14 },
  { name: "Emerging Markets", pct: 8 },
];

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
              Diversification across geographies, asset classes and time
              horizons — engineered so that no single event, market or decision
              can compromise the whole.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.08}>
              <TiltCard className="border border-paper/10 bg-ink-soft p-7 transition-colors duration-500 hover:border-gold/30">
                <m.icon
                  size={18}
                  strokeWidth={1.4}
                  className="text-gold"
                  aria-hidden="true"
                />
                <p className="tabular mt-6 font-serif text-4xl text-paper">
                  {m.value}
                </p>
                <p className="mt-2 text-[0.68rem] uppercase tracking-[0.24em] text-gold">
                  {m.label}
                </p>
                <p className="mt-3 text-xs font-light leading-relaxed text-stone">
                  {m.caption}
                </p>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5" delay={0.1}>
            <div className="h-full border border-paper/8 bg-ink-soft p-6 sm:p-8">
              <h3 className="font-serif text-xl text-paper">
                Global Diversification
              </h3>
              <p className="mt-1 text-xs tracking-wide text-stone">
                Geographic exposure, % of portfolio
              </p>
              <ul className="mt-8 space-y-6">
                {REGIONS.map((r) => (
                  <li key={r.name}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-light text-paper-dim">
                        {r.name}
                      </span>
                      <span className="tabular text-sm text-paper">
                        {r.pct}%
                      </span>
                    </div>
                    <div className="mt-2.5 h-px w-full bg-paper/10">
                      <div
                        className="h-px bg-gold transition-[width] duration-1000"
                        style={{ width: `${r.pct * 2.6}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-[0.65rem] leading-relaxed tracking-wide text-stone-dim">
                Illustrative exposure for design purposes only.
              </p>
            </div>
          </Reveal>
          <Reveal className="lg:col-span-7" delay={0.2}>
            <DrawdownChart />
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <p className="mt-14 border-l border-gold/40 pl-6 font-serif text-xl italic leading-relaxed text-stone sm:text-2xl">
            “The first rule of compounding is to never interrupt it
            unnecessarily. The first rule of Taizan is to never make that
            possible.”
          </p>
        </Reveal>
      </div>
    </section>
  );
}
