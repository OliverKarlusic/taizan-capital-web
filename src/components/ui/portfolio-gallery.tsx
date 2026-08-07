"use client";

/* eslint-disable @next/next/no-img-element -- conviction plates are sized by
   CSS inside a transformed carousel; next/image adds nothing here. */

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CONVICTIONS, type Conviction } from "@/lib/portfolio";
import { mediaUrl } from "@/lib/media";

/**
 * The five convictions, presented as a slow carousel.
 *
 * Deliberately not a card deck. Each conviction occupies a single wide
 * plate, one at a time, in the proportion of a frame from the film — the
 * section reads as the journey's index rather than a product grid.
 *
 * Movement is a long cross-dissolve with a small scale drift, never a
 * slide or a flip. The nav is a row of hairlines, because a luxury
 * presentation does not use dots.
 *
 * Reduced-motion visitors get all five stacked, complete and static.
 */

const DURATION = 1.15;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function Plate({ c, eager }: { c: Conviction; eager: boolean }) {
  return (
    <figure className="relative h-full w-full overflow-hidden bg-charcoal">
      {c.image ? (
        <img
          src={mediaUrl(c.image)}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover [filter:contrast(1.06)_saturate(0.8)_brightness(0.9)]"
        />
      ) : null}

      {/* Warm tint, matching the film's grade so a still never reads as a
          different production from the footage it came from. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{ backgroundColor: "rgba(198,166,100,0.18)" }}
      />
      {/* Legibility: weighted to the left, where the type sits. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.72) 38%, rgba(10,10,10,0.3) 68%, rgba(10,10,10,0.15) 100%)",
        }}
      />

      <figcaption className="relative flex h-full flex-col justify-center px-8 py-12 sm:px-14 lg:px-20">
        <p className="text-[0.62rem] uppercase tracking-[0.34em] text-gold">
          {c.index} — {c.name}
        </p>

        <h3 className="mt-7 max-w-2xl font-serif text-[clamp(1.6rem,3.4vw,2.9rem)] font-medium leading-[1.14] text-paper">
          {c.message}
        </h3>

        <p className="mt-6 max-w-lg text-sm font-light leading-[1.85] text-paper-dim">
          {c.purpose}
        </p>

        <ul className="mt-9 flex flex-wrap gap-x-8 gap-y-3">
          {c.principles.map((p) => (
            <li
              key={p}
              className="text-[0.6rem] uppercase tracking-[0.26em] text-stone"
            >
              {p}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

export default function PortfolioGallery() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const plates = useRef<(HTMLDivElement | null)[]>([]);
  const busy = useRef(false);

  const goTo = useCallback(
    (next: number) => {
      if (reduced || busy.current || next === active) return;
      const from = plates.current[active];
      const to = plates.current[next];
      if (!from || !to) return;

      busy.current = true;
      // Cross-dissolve with a slight counter-drift in scale: the outgoing
      // plate settles back, the incoming one eases forward. It reads as
      // depth rather than as a slide.
      gsap.to(from, {
        opacity: 0,
        scale: 1.03,
        duration: DURATION,
        ease: "power2.inOut",
      });
      gsap.fromTo(
        to,
        { opacity: 0, scale: 1.06 },
        {
          opacity: 1,
          scale: 1,
          duration: DURATION,
          ease: "power2.inOut",
          onComplete: () => {
            busy.current = false;
          },
        },
      );
      setActive(next);
    },
    [active, reduced],
  );

  const step = useCallback(
    (dir: 1 | -1) =>
      goTo((active + dir + CONVICTIONS.length) % CONVICTIONS.length),
    [active, goTo],
  );

  if (reduced) {
    return (
      <ul className="space-y-6">
        {CONVICTIONS.map((c) => (
          <li key={c.slug} className="h-[26rem] sm:h-[30rem]">
            <Plate c={c} eager />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Investment convictions"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          step(1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          step(-1);
        }
      }}
      className="focus:outline-none focus-visible:ring-1 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
    >
      <div className="relative h-[28rem] w-full overflow-hidden border border-paper/10 sm:h-[32rem] lg:h-[36rem]">
        {CONVICTIONS.map((c, i) => (
          <div
            key={c.slug}
            ref={(el) => {
              plates.current[i] = el;
            }}
            aria-hidden={i !== active}
            className="absolute inset-0"
            style={{ opacity: i === active ? 1 : 0 }}
          >
            <Plate c={c} eager={i === 0} />
          </div>
        ))}
      </div>

      {/* Hairline index. Five rules, the active one lit — a presentation
          does not use dots. */}
      <div className="mt-8 flex items-center gap-6">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous conviction"
          className="border border-paper/20 p-2.5 text-stone transition-colors duration-500 hover:border-gold hover:text-gold"
        >
          <ChevronLeft size={15} strokeWidth={1.5} />
        </button>

        <ul className="flex flex-1 items-center gap-3">
          {CONVICTIONS.map((c, i) => (
            <li key={c.slug} className="flex-1">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${c.index} — ${c.name}`}
                aria-current={i === active}
                className="group block w-full py-3"
              >
                <span
                  className={`block h-px w-full transition-colors duration-700 ${
                    i === active
                      ? "bg-gold"
                      : "bg-paper/15 group-hover:bg-paper/40"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next conviction"
          className="border border-paper/20 p-2.5 text-stone transition-colors duration-500 hover:border-gold hover:text-gold"
        >
          <ChevronRight size={15} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
