"use client";

import SplitText from "@/components/animations/SplitText";
import Reveal from "@/components/animations/Reveal";
import MagneticButton from "@/components/ui/MagneticButton";
import { ArrowDown } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="top"
      aria-label="Taizan Capital — introduction"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      {/* Legibility veil — snow and sky are bright, so the type needs a
          deeper scrim than a dark scene would call for. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_66%_54%_at_50%_46%,rgba(10,10,10,0.62),rgba(10,10,10,0.18)_62%,transparent_82%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-ink/75 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-ink/85"
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <Reveal delay={0.2}>
          <p className="overline-label mb-8">
            Taizan Capital <span className="mx-3 text-stone-dim">·</span> 泰山
            — The Great Mountain
          </p>
        </Reveal>

        <h1 className="font-serif text-[clamp(2.6rem,7vw,5.8rem)] font-medium leading-[1.06] tracking-tight text-paper">
          <SplitText text="Building Generational Wealth" immediate delay={0.55} />
          <br />
          <SplitText
            text="Through Discipline."
            immediate
            delay={1.05}
            className="text-gold-bright"
          />
        </h1>

        <Reveal delay={1.7}>
          <p className="mx-auto mt-8 max-w-2xl text-base font-light leading-relaxed text-paper-dim sm:text-lg">
            Taizan Capital combines rigorous investment principles with a
            long-term vision for sustainable capital growth.
          </p>
        </Reveal>

        <Reveal delay={2.0}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
            <MagneticButton href="#philosophy">
              Explore Our Philosophy
            </MagneticButton>
            <MagneticButton href="#approach" variant="outline">
              Our Approach
            </MagneticButton>
          </div>
        </Reveal>
      </div>

      <Reveal
        delay={2.5}
        className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2"
      >
        <a
          href="#journey"
          aria-label="Scroll to begin the journey"
          className="flex flex-col items-center gap-3 text-stone transition-colors duration-500 hover:text-gold"
        >
          <span className="text-[0.62rem] uppercase tracking-[0.34em]">
            Begin the Ascent
          </span>
          <span className="relative block h-12 w-px overflow-hidden bg-paper/15">
            <span className="absolute left-0 top-0 h-4 w-px animate-[scrollcue_2.4s_ease-in-out_infinite] bg-gold" />
          </span>
          <ArrowDown size={13} strokeWidth={1.5} className="opacity-60" />
        </a>
      </Reveal>

      <style>{`
        @keyframes scrollcue {
          0% { transform: translateY(-100%); }
          60%, 100% { transform: translateY(340%); }
        }
      `}</style>
    </section>
  );
}
