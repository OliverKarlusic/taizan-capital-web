"use client";

/* eslint-disable @next/next/no-img-element -- conviction plates are sized by
   CSS inside a 3D transform; next/image adds nothing here. */

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CONVICTIONS, type Conviction } from "@/lib/portfolio";
import { mediaUrl } from "@/lib/media";

gsap.registerPlugin(ScrollTrigger);

/**
 * Circular gallery — the five convictions arranged on a ring in 3D.
 *
 * The ring is the interaction framework; everything else is Taizan. Rotation
 * has three inputs — scroll through the section, pointer drag, and keyboard
 * — all writing to one angle that GSAP eases, so they never fight.
 *
 * Depth does the art direction. A card's angular distance from the front
 * sets its opacity, saturation and how far it recedes, so the eye is told
 * where to look without a glow, a shadow or a border doing the telling.
 * Cards past the shoulder stop receiving pointer events, so you can never
 * click something you cannot properly see.
 *
 * Reduced motion gets the five stacked and static. A rotating 3D ring is
 * precisely the motion that setting exists to switch off, and the
 * information is identical either way.
 */

/* Radius is derived, not chosen. With N cards of width W sitting on a ring,
   they only sit shoulder to shoulder when 2*pi*R = N*W. At a larger radius
   the ring opens 72-degree gaps between five cards and the front of the
   carousel is literally empty half the time — which is what happens if you
   pick a radius that merely "looks about right". */
const CARD_MAX = 400;
const GAP = 34;
/** Card never exceeds the viewport minus a safe gutter, so the ring cannot
 *  push content past the frame on a narrow screen. Radius follows the card:
 *  cards sit shoulder to shoulder only when 2*pi*R = N*(W+gap). */
function ringMetrics(vw: number) {
  // Below ~640 the front card needs a wider gutter, not just "viewport
  // minus a bit" — at 390 a 318px card leaves 36px each side and the
  // neighbours crowd straight into it.
  const gutter = vw < 640 ? 108 : 72;
  const w = Math.min(CARD_MAX, Math.max(230, vw - gutter));
  return { w, radius: Math.round(((w + GAP) * 5) / (2 * Math.PI)) };
}

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

function Card({ c, front }: { c: Conviction; front: boolean }) {
  return (
    <figure className="relative h-full w-full overflow-hidden border border-paper/12 bg-charcoal">
      <img
        src={mediaUrl(c.image)}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover [filter:contrast(1.06)_saturate(0.78)_brightness(0.88)]"
      />
      {/* Warm tint matching the film's grade, so a still never reads as a
          different production from the footage it was cut from. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{ backgroundColor: "rgba(198,166,100,0.18)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.42) 0%, rgba(10,10,10,0.15) 34%, rgba(10,10,10,0.78) 74%, rgba(10,10,10,0.94) 100%)",
        }}
      />

      <figcaption className="relative flex h-full flex-col justify-end p-7 sm:p-8">
        <p className="text-[0.58rem] uppercase tracking-[0.32em] text-gold">
          {c.index}
        </p>
        <h3 className="mt-3 font-serif text-[1.45rem] leading-[1.15] text-paper sm:text-[1.65rem]">
          {c.name}
        </h3>
        <p className="mt-3 border-t border-paper/15 pt-3 font-serif text-[0.95rem] italic leading-snug text-paper-dim">
          {c.statement}
        </p>

        {/* The mandate itself is revealed only on the front card. Reading
            copy on a plate angled away from you is a strain, and showing it
            on all five turns a gallery into a wall of text. */}
        <div
          className="grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            gridTemplateRows: front ? "1fr" : "0fr",
            opacity: front ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <p className="mt-3 text-[0.72rem] font-light leading-[1.7] text-stone">
              {c.purpose}
            </p>
            <Link
              href={`/portfolios/${c.slug}`}
              tabIndex={front ? 0 : -1}
              aria-hidden={!front}
              className="mt-5 inline-flex items-center gap-2 border-b border-gold/50 pb-1 text-[0.6rem] uppercase tracking-[0.28em] text-gold transition-colors duration-500 hover:border-gold hover:text-gold-bright"
            >
              See more
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </figcaption>
    </figure>
  );
}

export default function PortfolioGallery() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const angle = useRef({ value: 0 });
  const [active, setActive] = useState(0);
  const [metrics, setMetrics] = useState(() => ringMetrics(1440));
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const on = () => {
      setMetrics(ringMetrics(window.innerWidth));
      setCompact(window.innerWidth < 640);
    };
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const { w: CARD_W, radius: RADIUS } = metrics;

  const step = 360 / CONVICTIONS.length;

  /** Apply the ring angle, then re-derive each card's depth styling. */
  const render = useCallback(() => {
    const ring = ringRef.current;
    if (!ring) return;
    ring.style.transform = `translateZ(-${RADIUS}px) rotateY(${angle.current.value}deg)`;

    ring.querySelectorAll<HTMLElement>("[data-card]").forEach((card, i) => {
      let d = (i * step + angle.current.value) % 360;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      const t = Math.abs(d) / 180;
      card.style.opacity = String(1 - t * 0.82);
      card.style.filter = `saturate(${1 - t * 0.55}) brightness(${1 - t * 0.3})`;
      card.style.pointerEvents = t < 0.2 ? "auto" : "none";
    });

    const nearest =
      ((Math.round(-angle.current.value / step) % CONVICTIONS.length) +
        CONVICTIONS.length) %
      CONVICTIONS.length;
    setActive(nearest);
  }, [step, RADIUS]);

  const rotateTo = useCallback(
    (deg: number) => {
      gsap.to(angle.current, {
        value: deg,
        duration: 1.25,
        ease: "power3.out",
        onUpdate: render,
      });
    },
    [render],
  );

  const turn = useCallback(
    (dir: 1 | -1) => rotateTo(angle.current.value - dir * step),
    [rotateTo, step],
  );

  // Scroll drives the ring as the section passes — the gallery advances
  // because the visitor is descending, not because they operated a control.
  useEffect(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;
    render();

    const ctx = gsap.context(() => {
      gsap.to(angle.current, {
        value: -(360 - step),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 78%",
          end: "bottom 22%",
          scrub: 1.1,
        },
        onUpdate: render,
      });
    }, el);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced, render, step, RADIUS]);

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
      angle.current.value = startAngle + (e.clientX - startX) * 0.22;
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

  /* A five-card ring cannot show its neighbours on a 390px screen without
     cutting them: at that width the off-axis plates land inside the frame
     mid-word, which reads as a broken layout rather than as depth. Masking
     the edges does not work either — a mask creates a containing context
     that breaks preserve-3d, so the fade never renders.

     Below 640 the ring becomes a single plate with the same controls. The
     visitor still steps through five strategies with the same arrows,
     hairlines and arrow keys; they simply see one at a time, which is what
     the width allows. */
  if (compact && !reduced) {
    return (
      <div className="select-none px-6">
        <div
          role="group"
          aria-roledescription="carousel"
          aria-label="Investment convictions"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); turn(1); }
            if (e.key === "ArrowLeft") { e.preventDefault(); turn(-1); }
          }}
          className="h-[27rem] focus:outline-none focus-visible:ring-1 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
        >
          <Card c={CONVICTIONS[active]} front />
        </div>

        <div className="mt-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => turn(-1)}
            aria-label="Previous conviction"
            className="shrink-0 border border-paper/20 p-2.5 text-stone transition-colors duration-500 hover:border-gold hover:text-gold"
          >
            <ChevronLeft size={15} strokeWidth={1.5} />
          </button>
          <ul className="flex flex-1 items-center gap-2">
            {CONVICTIONS.map((c, i) => (
              <li key={c.slug} className="flex-1">
                <button
                  type="button"
                  onClick={() => rotateTo(-i * step)}
                  aria-label={`${c.index} — ${c.name}`}
                  aria-current={i === active}
                  className="group block w-full py-3"
                >
                  <span
                    className={`block h-px w-full transition-colors duration-700 ${
                      i === active ? "bg-gold" : "bg-paper/15"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => turn(1)}
            aria-label="Next conviction"
            className="shrink-0 border border-paper/20 p-2.5 text-stone transition-colors duration-500 hover:border-gold hover:text-gold"
          >
            <ChevronRight size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    );
  }

  if (reduced) {
    return (
      <ul className="mx-auto grid max-w-7xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3 lg:px-10">
        {CONVICTIONS.map((c) => (
          <li key={c.slug} className="h-[28rem]">
            <Card c={c} front />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div ref={sectionRef} className="select-none">
      <div
        className="relative h-[25rem] cursor-grab active:cursor-grabbing sm:h-[28rem]"
        style={{ perspective: "1150px" }}
        role="group"
        aria-roledescription="carousel"
        aria-label="Investment convictions"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            turn(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            turn(-1);
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
          {CONVICTIONS.map((c, i) => (
            <div
              key={c.slug}
              data-card
              aria-hidden={i !== active}
              className="absolute inset-0 transition-[opacity,filter] duration-500"
              style={{
                transform: `rotateY(${i * step}deg) translateZ(${RADIUS}px)`,
                // Without this the far side of the ring shows its text
                // through the near side, mirrored.
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <Card c={c} front={i === active} />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl items-center gap-6 px-6">
        <button
          type="button"
          onClick={() => turn(-1)}
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
                onClick={() => rotateTo(-i * step)}
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
          onClick={() => turn(1)}
          aria-label="Next conviction"
          className="border border-paper/20 p-2.5 text-stone transition-colors duration-500 hover:border-gold hover:text-gold"
        >
          <ChevronRight size={15} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
