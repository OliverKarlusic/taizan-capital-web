"use client";

/* eslint-disable @next/next/no-img-element -- holding photography is sized
   by CSS inside a 3D transform; next/image adds nothing here. */

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HOLDINGS, type Holding } from "@/lib/portfolio";
import { mediaUrl } from "@/lib/media";

gsap.registerPlugin(ScrollTrigger);

/**
 * Circular portfolio gallery.
 *
 * Holdings sit on a horizontal carousel ring in 3D. Rotation is driven three
 * ways — scrubbed by scroll through the section, dragged by pointer, and
 * stepped by keyboard — all writing to one angle that GSAP eases, so the
 * three inputs never fight each other.
 *
 * Depth does the art direction: a card's distance from the front sets its
 * opacity and how far it recedes, so the eye is told where to look without
 * any glow, glass or gradient.
 *
 * Reduced-motion visitors get a plain grid instead. A rotating 3D ring is
 * exactly the kind of motion that setting exists to switch off, and the
 * information is identical either way.
 */

const RADIUS = 460;
const CARD_W = 300;

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

function HoldingCard({
  holding,
  expanded,
}: {
  holding: Holding;
  expanded: boolean;
}) {
  return (
    <article
      className="flex h-full flex-col border border-paper/12 bg-ink-soft"
      style={{ width: CARD_W }}
    >
      {/* Image slot — real licensed photography only */}
      <div className="relative aspect-[4/3] overflow-hidden bg-charcoal">
        {holding.image ? (
          <img
            src={mediaUrl(holding.image)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          // Awaiting photography: a quiet charcoal field carrying the
          // holding's initial. Reads as a deliberate editorial device rather
          // than a missing asset, and never exposes the sourcing brief —
          // that lives in src/lib/portfolio.ts, for us, not for visitors.
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-charcoal"
          >
            <span className="font-serif text-5xl text-paper/10">
              {holding.company.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.58rem] uppercase tracking-[0.24em] text-gold">
          {holding.category}
        </p>
        <h3 className="mt-2 font-serif text-xl leading-snug text-paper">
          {holding.company}
        </h3>

        <dl className="tabular mt-4 flex items-baseline justify-between border-t border-paper/10 pt-3 text-[0.7rem]">
          <div>
            <dt className="text-[0.55rem] uppercase tracking-[0.18em] text-stone-dim">
              Return
            </dt>
            <dd className="mt-0.5 text-paper">{holding.performance}</dd>
          </div>
          <div className="text-right">
            <dt className="text-[0.55rem] uppercase tracking-[0.18em] text-stone-dim">
              Weight
            </dt>
            <dd className="mt-0.5 text-paper">{holding.allocation}</dd>
          </div>
        </dl>

        {/* Hover/focus reveal */}
        <div
          className="grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            gridTemplateRows: expanded ? "1fr" : "0fr",
            opacity: expanded ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <p className="mt-3 text-xs font-light leading-relaxed text-paper-dim">
              {holding.description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PortfolioGallery() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const angle = useRef({ value: 0 });
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  const step = 360 / HOLDINGS.length;

  /** Apply the ring angle and re-derive each card's depth styling. */
  const render = useCallback(() => {
    const ring = ringRef.current;
    if (!ring) return;
    ring.style.transform = `translateZ(-${RADIUS}px) rotateY(${angle.current.value}deg)`;

    const cards = ring.querySelectorAll<HTMLElement>("[data-card]");
    cards.forEach((card, i) => {
      // Angular distance from the front of the ring, 0..180
      let d = (i * step + angle.current.value) % 360;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      const t = Math.abs(d) / 180;
      card.style.opacity = String(1 - t * 0.85);
      card.style.filter = `saturate(${1 - t * 0.6})`;
      card.style.pointerEvents = t < 0.18 ? "auto" : "none";
    });

    const nearest =
      (Math.round(-angle.current.value / step) % HOLDINGS.length +
        HOLDINGS.length) %
      HOLDINGS.length;
    setActive(nearest);
  }, [step]);

  const rotateTo = useCallback(
    (deg: number) => {
      gsap.to(angle.current, {
        value: deg,
        duration: reduced ? 0 : 1.1,
        ease: "power3.out",
        onUpdate: render,
      });
    },
    [reduced, render],
  );

  const go = useCallback(
    (dir: 1 | -1) => rotateTo(angle.current.value - dir * step),
    [rotateTo, step],
  );

  // Scroll scrub — the ring turns as the section passes through the viewport.
  useEffect(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;
    render();

    const ctx = gsap.context(() => {
      gsap.to(angle.current, {
        value: -360,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          end: "bottom 20%",
          scrub: 1.2,
        },
        onUpdate: render,
      });
    }, el);

    return () => ctx.revert();
  }, [reduced, render]);

  // Pointer drag
  useEffect(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;
    let startX = 0;
    let startAngle = 0;
    let dragging = false;

    const down = (e: PointerEvent) => {
      dragging = true;
      startX = e.clientX;
      startAngle = angle.current.value;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      angle.current.value = startAngle + (e.clientX - startX) * 0.25;
      render();
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      rotateTo(Math.round(angle.current.value / step) * step);
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [reduced, render, rotateTo, step]);

  // Reduced motion: a plain, complete grid.
  if (reduced) {
    return (
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {HOLDINGS.map((h) => (
          <li key={h.slug}>
            <HoldingCard holding={h} expanded />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div ref={sectionRef} className="select-none">
      <div
        className="relative h-[440px] cursor-grab active:cursor-grabbing"
        style={{ perspective: "1400px" }}
        role="group"
        aria-roledescription="carousel"
        aria-label="Portfolio holdings"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            go(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(-1);
          }
        }}
      >
        <div
          ref={ringRef}
          className="absolute left-1/2 top-0 h-full"
          style={{
            transformStyle: "preserve-3d",
            transform: `translateZ(-${RADIUS}px)`,
            width: CARD_W,
            marginLeft: -CARD_W / 2,
          }}
        >
          {HOLDINGS.map((h, i) => (
            <div
              key={h.slug}
              data-card
              className="absolute inset-0 transition-[opacity,filter] duration-300"
              style={{
                transform: `rotateY(${i * step}deg) translateZ(${RADIUS}px)`,
                // Cards on the far side face away; without this their text
                // shows through the ring mirrored.
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <HoldingCard holding={h} expanded={hovered === i || active === i} />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-center gap-8">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous holding"
          className="border border-paper/20 p-2.5 text-stone transition-colors duration-500 hover:border-gold hover:text-gold"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>

        <p
          className="tabular text-[0.62rem] uppercase tracking-[0.24em] text-stone"
          aria-live="polite"
        >
          {String(active + 1).padStart(2, "0")}
          <span className="mx-2 text-stone-dim">/</span>
          {String(HOLDINGS.length).padStart(2, "0")}
          <span className="mx-3 text-stone-dim">·</span>
          <span className="text-paper">{HOLDINGS[active].company}</span>
        </p>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next holding"
          className="border border-paper/20 p-2.5 text-stone transition-colors duration-500 hover:border-gold hover:text-gold"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
