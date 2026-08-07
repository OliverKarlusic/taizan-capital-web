"use client";

/* eslint-disable @next/next/no-img-element -- full-bleed parallax plates are
   sized by CSS inside transformed layers; next/image adds nothing here. */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HERO_LAYERS, hasLayerAsset, mediaUrl, type HeroLayer } from "@/lib/media";
import MagneticButton from "@/components/ui/MagneticButton";

gsap.registerPlugin(ScrollTrigger);

/**
 * Cinematic parallax hero.
 *
 * Four depth planes driven off a single scrubbed ScrollTrigger timeline:
 *
 *   1  Atmosphere   travels least   — haze and high cloud
 *   2  Environment  medium          — the Fuji landscape (video or still)
 *   3  Brand        counter-drifts  — typography
 *   4  Foreground   travels most    — near branches and mist
 *
 * Nearer planes travel further, which is what reads as moving *through* a
 * landscape rather than sliding a backdrop behind glass. Travel figures are
 * deliberately small — the brief is "almost invisible", so the furthest
 * plane moves 8% of the viewport across the whole scroll and the nearest
 * 55%. Anything more and it becomes a theme-park ride.
 *
 * Every plate is a real-asset slot. Until licensed media is registered in
 * src/lib/media.ts, a plane renders a sourcing frame naming the shot it
 * needs; nothing is ever generated to fill the gap.
 *
 * Lenis is not instantiated here — the app owns one instance in
 * SmoothScroll, and ScrollTrigger is already wired to it. Cleanup is scoped
 * through gsap.context() so unmounting this hero cannot kill the triggers
 * belonging to the rest of the page.
 */

function LayerPlate({ layer }: { layer: HeroLayer }) {
  // An unsourced plane renders nothing at all. The atmosphere and foreground
  // planes composite *over* the environment, so a placeholder pattern here
  // would veil the real footage behind it. The status card below reports
  // which planes are still missing.
  if (!hasLayerAsset(layer)) return null;

  if (layer.video?.length) {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        poster={layer.poster ? mediaUrl(layer.poster) : undefined}
      >
        {layer.video.map((s) => (
          <source key={s.src} src={mediaUrl(s.src)} type={s.type} />
        ))}
      </video>
    );
  }

  return (
    <img
      src={mediaUrl(layer.src!)}
      alt=""
      decoding="async"
      fetchPriority={layer.id === "environment" ? "high" : "auto"}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

export default function CinematicParallaxHero({
  title = "Taizan Capital",
  tagline = "Building enduring wealth through discipline and patience.",
}: {
  title?: string;
  tagline?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      HERO_LAYERS.forEach((layer, i) => {
        tl.to(
          `[data-parallax-layer="${layer.id}"]`,
          { yPercent: layer.travel, ease: "none" },
          i === 0 ? 0 : "<",
        );
      });

      // The brand plate drifts up and dissolves as the landscape descends.
      tl.to(
        "[data-parallax-layer='brand']",
        { yPercent: -14, opacity: 0, ease: "none" },
        "<",
      );
    }, root);

    return () => ctx.revert();
  }, []);

  const unsourced = HERO_LAYERS.filter((l) => !hasLayerAsset(l));

  return (
    <section
      ref={rootRef}
      id="top"
      aria-label="Taizan Capital — introduction"
      className="relative h-screen overflow-hidden bg-ink"
    >
      {/* 1 — Atmosphere (furthest, slowest) */}
      <div
        data-parallax-layer="atmosphere"
        className="absolute inset-0 scale-110 will-change-transform"
      >
        <LayerPlate layer={HERO_LAYERS[0]} />
      </div>

      {/* 2 — Environment */}
      <div
        data-parallax-layer="environment"
        className="absolute inset-0 scale-110 will-change-transform"
      >
        <LayerPlate layer={HERO_LAYERS[1]} />
      </div>

      {/* Legibility scrim — sits between the landscape and the type */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_78%_60%_at_50%_46%,rgba(10,10,10,0.55),rgba(10,10,10,0.2)_62%,transparent_88%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-ink"
      />

      {/* 3 — Brand */}
      <div
        data-parallax-layer="brand"
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center will-change-transform"
      >
        <p className="overline-label mb-8">泰山資本 — The Great Mountain</p>
        <h1 className="font-serif text-[clamp(2.8rem,8vw,7rem)] font-medium leading-[1.02] tracking-tight text-paper">
          {title}
        </h1>
        <p className="mt-8 max-w-xl text-base font-light leading-relaxed text-paper-dim sm:text-lg">
          {tagline}
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
          <MagneticButton href="#philosophy">
            Explore Our Philosophy
          </MagneticButton>
          <MagneticButton href="#approach" variant="outline">
            Our Approach
          </MagneticButton>
        </div>

        <a
          href="#journey"
          className="mt-16 flex flex-col items-center gap-3 text-stone transition-colors duration-500 hover:text-gold"
        >
          <span className="text-[0.62rem] uppercase tracking-[0.34em]">
            Begin the Ascent
          </span>
          <span className="block h-10 w-px bg-paper/15" aria-hidden="true" />
        </a>
      </div>

      {/* 4 — Foreground (nearest, fastest) */}
      <div
        data-parallax-layer="foreground"
        className="pointer-events-none absolute inset-0 z-20 scale-110 will-change-transform"
      >
        <LayerPlate layer={HERO_LAYERS[2]} />
      </div>

      {/* Sourcing status — visible only while plates are unconnected */}
      {unsourced.length > 0 ? (
        <div className="absolute bottom-6 left-6 z-30 max-w-md border border-stone-dim/50 bg-ink/90 px-4 py-3 lg:left-10">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-gold">
            {unsourced.length} parallax plate
            {unsourced.length > 1 ? "s" : ""} awaiting real assets
          </p>
          <p className="mt-1.5 font-mono text-[0.6rem] leading-relaxed text-stone">
            {unsourced.map((l) => l.label.split("—")[1]?.trim()).join(" · ")}
            <br />
            Drop files in{" "}
            <span className="text-paper-dim">public/media/hero/layers/</span>{" "}
            and register in{" "}
            <span className="text-paper-dim">src/lib/media.ts</span>
          </p>
        </div>
      ) : null}
    </section>
  );
}
