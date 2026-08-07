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

    // Documentary pacing. Playing the master slightly under speed makes the
    // cloud movement contemplative rather than brisk — the single cheapest
    // change that separates a luxury edit from stock footage. Applied even
    // under reduced motion, since it removes movement rather than adding it.
    const video = root.querySelector<HTMLVideoElement>("video");
    if (video) video.playbackRate = 0.82;

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

      // A slow push on the environment plane. This is the "camera" — 6% of
      // scale across the whole hero, which is felt rather than seen.
      tl.fromTo(
        "[data-parallax-layer='environment']",
        { scale: 1.08 },
        { scale: 1.14, ease: "none" },
        0,
      );

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

      {/* 2 — Environment, carrying the grade.
          The grade lives on the plane, not the composite, so the type and
          logo above stay unfiltered. Values are deliberately conservative:
          a touch more contrast for the cinematic floor, saturation eased
          back so the snow reads ivory rather than digital blue-white, and
          the natural colour left otherwise alone. */}
      <div
        data-parallax-layer="environment"
        className="absolute inset-0 will-change-transform [filter:contrast(1.07)_saturate(0.88)_brightness(0.96)]"
      >
        <LayerPlate layer={HERO_LAYERS[1]} />
      </div>

      {/* ── Cinematic treatment stack, bottom to top ──
          Every overlay is transparent across the middle of the frame; the
          footage stays the visual. */}

      {/* Tonal wash — cools the shadows toward ink, leaves highlights alone */}
      <div
        aria-hidden="true"
        className="absolute inset-0 mix-blend-multiply"
        style={{
          background:
            "linear-gradient(180deg, rgba(14,16,18,0.35) 0%, transparent 30%, transparent 62%, rgba(10,10,10,0.5) 100%)",
        }}
      />

      {/* Legibility: radial pool behind the type block only */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_62%_48%_at_50%_47%,rgba(10,10,10,0.5),rgba(10,10,10,0.16)_60%,transparent_82%)]"
      />
      {/* Legibility: anchor gradients for navbar and fold */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-ink/60 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent via-ink/40 to-ink"
      />

      {/* Vignette — pulls the corners in half a stop */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 45%, transparent 68%, rgba(10,10,10,0.42) 100%)",
        }}
      />

      {/* Film grain — static SVG noise, faint. What keeps digital video
          from feeling like a screensaver. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "240px 240px",
        }}
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
