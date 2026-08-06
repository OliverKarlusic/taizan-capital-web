"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scrub-driven layered parallax.
 *
 * Functionality is the original: four layers driven off one ScrollTrigger
 * timeline, each translating at its own rate so the stack separates as the
 * section passes.
 *
 * Three things were changed for this codebase, all of them load-bearing:
 *
 *  1. It no longer creates a Lenis instance. The app already runs one in
 *     SmoothScroll; a second would fight the first for the scroll position.
 *  2. Cleanup is scoped through gsap.context(). The original called
 *     ScrollTrigger.getAll().kill(), which would have destroyed every other
 *     trigger on the page — the journey chapters and the approach timeline.
 *  3. The demo's hotlinked CDN images are gone. Layers are built from type
 *     and hairline rules instead: nothing generated, nothing hotlinked, and
 *     no asset to license.
 */

interface ParallaxLayer {
  /** Depth rate — larger travels further, so it reads as nearer. */
  yPercent: number;
  content: React.ReactNode;
  className?: string;
}

export function ParallaxComponent({
  eyebrow = "泰山 — The Great Mountain",
  title = "Perspective",
  caption = "Above uncertainty, looking toward a permanent foundation.",
}: {
  eyebrow?: string;
  title?: string;
  caption?: string;
}) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = parallaxRef.current;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const trigger = root.querySelector("[data-parallax-layers]");
      if (!trigger) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0.4,
        },
      });

      (
        [
          { layer: "1", yPercent: 70 },
          { layer: "2", yPercent: 55 },
          { layer: "3", yPercent: 40 },
          { layer: "4", yPercent: 10 },
        ] as const
      ).forEach((layerObj, idx) => {
        tl.to(
          trigger.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          { yPercent: layerObj.yPercent, ease: "none" },
          idx === 0 ? undefined : "<",
        );
      });
    }, root);

    // Scoped revert: only this component's triggers and tweens are killed.
    return () => ctx.revert();
  }, []);

  return (
    <div ref={parallaxRef} className="relative">
      <section className="relative h-[150vh]">
        <div className="sticky top-0 h-screen overflow-hidden bg-ink">
          <div
            data-parallax-layers
            className="relative flex h-full items-center justify-center"
          >
            {/* 1 — furthest: an oversized kanji watermark */}
            <span
              data-parallax-layer="1"
              aria-hidden="true"
              className="pointer-events-none absolute select-none font-serif text-[38vw] leading-none text-paper/[0.035]"
            >
              山
            </span>

            {/* 2 — hairline horizon rules */}
            <div
              data-parallax-layer="2"
              aria-hidden="true"
              className="absolute inset-x-0 flex flex-col gap-16"
            >
              {[0.18, 0.1, 0.05].map((o) => (
                <div
                  key={o}
                  className="h-px w-full"
                  style={{ background: `rgba(198,166,100,${o})` }}
                />
              ))}
            </div>

            {/* 3 — the title plate */}
            <div
              data-parallax-layer="3"
              className="relative z-10 px-6 text-center"
            >
              <p className="overline-label mb-6">{eyebrow}</p>
              <h2 className="font-serif text-[clamp(3rem,11vw,9rem)] font-medium leading-[0.95] tracking-tight text-paper">
                {title}
              </h2>
            </div>

            {/* 4 — nearest: caption, travels least */}
            <div
              data-parallax-layer="4"
              className="absolute bottom-[18%] left-1/2 w-full max-w-md -translate-x-1/2 px-6 text-center"
            >
              <p className="text-sm font-light leading-relaxed text-paper-dim">
                {caption}
              </p>
            </div>
          </div>

          {/* Bottom fade into the next section */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-ink"
          />
        </div>
      </section>
    </div>
  );
}

export default ParallaxComponent;
