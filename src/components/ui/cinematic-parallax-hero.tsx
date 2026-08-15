"use client";

/* eslint-disable @next/next/no-img-element -- full-bleed parallax plates are
   sized by CSS inside transformed layers; next/image adds nothing here. */

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  HERO_LAYERS,
  hasLayerAsset,
  mediaUrl,
  pickRenditions,
  selectRenditions,
  hasFootage,
  SCENE_BY_ID,
  type HeroLayer,
} from "@/lib/media";
import { useAdaptiveMedia } from "@/hooks/useAdaptiveMedia";
import MagneticButton from "@/components/ui/MagneticButton";

gsap.registerPlugin(ScrollTrigger);

/**
 * The grade — one continuous ramp, cold to warm, across the journey.
 *
 * Three clips from three sources will always look like three clips unless
 * a single curve runs through them. The ramp is also the argument: the
 * palette warms as capital matures, so temperature carries the story
 * rather than decorating it.
 *
 *   Fuji   cold, ivory highlights, blue shadows   — altitude and clarity
 *   Forest warming, greens pulled to moss         — cultivation
 *   River  warmest, bronze in the highlights      — compounding
 *
 * Saturation falls as the ramp progresses. The forest footage in
 * particular is a saturated emerald that reads as stock the moment it is
 * left alone; pulling it toward olive is what makes it look shot rather
 * than bought. Each plane pairs a filter with a tint at soft-light, which
 * shifts temperature without flattening the image the way a plain
 * overlay does.
 */
const GRADE = {
  fuji: {
    filter: "contrast(1.07) saturate(0.88) brightness(0.96)",
    tint: "rgba(150,180,205,0.16)",
  },
  forest: {
    filter: "contrast(1.1) saturate(0.7) brightness(0.99)",
    tint: "rgba(196,178,132,0.2)",
  },
  river: {
    filter: "contrast(1.08) saturate(0.76) brightness(1.02)",
    tint: "rgba(214,180,124,0.24)",
  },
} as const;

/** Temperature wash for an environment plane. */
function Tint({ colour }: { colour: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 mix-blend-soft-light"
      style={{ backgroundColor: colour }}
    />
  );
}

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

function LayerPlate({
  layer,
  targetWidth,
  videoRef,
}: {
  layer: HeroLayer;
  targetWidth: number;
  /** Handed to GSAP, so tweens never depend on a selector match. */
  videoRef?: React.Ref<HTMLVideoElement>;
}) {
  // An unsourced plane renders nothing at all. The atmosphere and foreground
  // planes composite *over* the environment, so a placeholder pattern here
  // would veil the real footage behind it. The status card below reports
  // which planes are still missing.
  if (!hasLayerAsset(layer)) return null;

  // Compositing is declared in the manifest so a plate's treatment travels
  // with the asset it belongs to, rather than being scattered through JSX.
  const composite: React.CSSProperties = {
    mixBlendMode: layer.blend as React.CSSProperties["mixBlendMode"],
    opacity: layer.opacity,
    filter: layer.filter,
    maskImage: layer.mask,
    WebkitMaskImage: layer.mask,
  };

  if (layer.video?.length) {
    // Same treatment on every device — only the file changes. The tier is
    // keyed off the rendered width, so a phone pulls the 854px encode while
    // keeping the identical blend, opacity, filter and mask.
    const sources = pickRenditions(layer.video, targetWidth);
    return (
      // No `key` here. Keying on the rendition src remounted the element
      // whenever useAdaptiveMedia resolved its real viewport width, which
      // left every GSAP tween holding a detached node — the reason the mist
      // bridge never fired. Re-picking a rendition on resize is not worth
      // tearing down a playing video mid-film.
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={composite}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        poster={layer.poster ? mediaUrl(layer.poster) : undefined}
      >
        {sources.map((s) => (
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
  const forestRef = useRef<HTMLVideoElement>(null);
  // Every GSAP target is a ref. Selector strings were resolved once at
  // context creation and silently went stale when React remounted a node.
  const mistRef = useRef<HTMLVideoElement>(null);
  const envRef = useRef<HTMLDivElement>(null);
  const forestPlaneRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<HTMLDivElement>(null);
  const foregroundRef = useRef<HTMLDivElement>(null);

  const mountainRef = useRef<HTMLDivElement>(null);
  const forestTextRef = useRef<HTMLDivElement>(null);
  const riverTextRef = useRef<HTMLDivElement>(null);
  const riverPlaneRef = useRef<HTMLDivElement>(null);
  const riverRef = useRef<HTMLVideoElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const poolRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [riverMounted, setRiverMounted] = useState(false);
  // The forest plate is not rendered until the fog is already dense, so it
  // cannot exist "underneath" the mountain and does not decode during it.
  const [forestMounted, setForestMounted] = useState(false);

  const { ready, targetWidth } = useAdaptiveMedia();

  const forest = useMemo(() => {
    const scene = SCENE_BY_ID.forest;
    return hasFootage(scene) ? selectRenditions(scene, targetWidth) : null;
  }, [targetWidth]);

  const river = useMemo(() => {
    const scene = SCENE_BY_ID.river;
    return hasFootage(scene) ? selectRenditions(scene, targetWidth) : null;
  }, [targetWidth]);

  /**
   * Decode budget. Three 4K plates decoding at once is the one real
   * performance risk in this transition, so only two ever run: the forest
   * starts just before the fog closes, and Fuji is paused the moment the
   * whiteout has hidden it. Both are driven off scroll progress rather than
   * a timer, so a fast scroller and a slow one get the same behaviour.
   */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let started = false;
    const onScroll = () => {
      const r = root.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(Math.max(-r.top / span, 0), 1) : 0;

      /* Mount each environment INSIDE its bridge, while the fog is dense
         enough to hide the arrival — but always before the reveal tween
         starts, or the plate animates its opacity with nothing inside it
         and the footage pops in late.
             forest revealed at 0.43  -> mount 0.36
             river  revealed at 0.745 -> mount 0.68 */
      if (!forestMounted && p > 0.36) setForestMounted(true);
      if (!riverMounted && p > 0.68) setRiverMounted(true);

      const fv = forestRef.current;
      if (fv && !started) {
        started = true;
        fv.playbackRate = 0.9;
        fv.play().catch(() => undefined);
      }
      const rv = riverRef.current;
      if (rv && rv.paused && p > 0.8) {
        rv.playbackRate = 0.9;
        rv.play().catch(() => undefined);
      }
      // Forest is covered from 0.90; stop decoding it.
      if (fv) {
        if (p > 0.92 && !fv.paused) fv.pause();
        else if (p <= 0.9 && fv.paused && started) fv.play().catch(() => undefined);
      }

      const hero = envRef.current?.querySelector("video") ?? null;
      if (hero) {
        // Fuji is at opacity 0 from 0.365, so decoding it past there is
        // paid for and never seen. The old threshold of 0.64 was left over
        // from an earlier timeline and kept a 1280p video decoding through
        // a quarter of the scroll for nothing.
        if (p > 0.42 && !hero.paused) hero.pause();
        else if (p <= 0.40 && hero.paused) hero.play().catch(() => undefined);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [forest, forestMounted, riverMounted]);

  useEffect(() => {
    const root = rootRef.current;
    // Wait for useAdaptiveMedia to resolve before building the timeline.
    // Built earlier, it measured a layout whose video sources had not been
    // chosen yet, and never re-measured.
    if (!root || !ready) return;

    // Documentary pacing. Playing the master slightly under speed makes the
    // cloud movement contemplative rather than brisk — the single cheapest
    // change that separates a luxury edit from stock footage. Applied even
    // under reduced motion, since it removes movement rather than adding it.
    const envVideo = envRef.current?.querySelector("video");
    if (envVideo) envVideo.playbackRate = 0.82;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const planeRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      atmosphere: atmosphereRef,
      environment: envRef,
      foreground: foregroundRef,
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          // "bottom bottom", not "bottom top". The stage inside this section
          // is sticky, so it stops being pinned once the section's bottom
          // reaches the viewport's bottom — a scroll distance of
          // (height - viewport), not the full section height. With "bottom
          // top" the timeline was mapped over a range 60% longer than the
          // stage is actually visible for, so the transition was still
          // mid-dissolve when the stage scrolled away.
          end: "bottom bottom",
          scrub: 0.6,
        },
      });

      HERO_LAYERS.forEach((layer) => {
        const el = planeRefs[layer.id]?.current;
        if (!el) return;
        tl.to(el, { yPercent: layer.travel, ease: "none", duration: 1 }, 0);
      });

      // A slow push on the environment plane. This is the "camera" — 6% of
      // scale across the whole hero, which is felt rather than seen.
      tl.fromTo(
        envRef.current,
        { scale: 1.08 },
        { scale: 1.14, ease: "none", duration: 1 },
        0,
      );

      /* ── The seven beats ──────────────────────────────────────────
         HERO       0.00–0.10  Fuji. Wordmark, tagline, CTAs.
         MOUNTAIN   0.10–0.30  Fuji alone. "01 — The Mountain".
         MIST I     0.30–0.40  Fuji dissolves, forest resolves.
         FOREST     0.40–0.66  Forest holds; "02 — The Forest".
         MIST II    0.66–0.76  Forest dissolves, river resolves.
         RIVER      0.76–1.00  River holds; "03 — The River".
         (HERO and MOUNTAIN share one environment; the film reads as three
         chapters, the timeline runs as seven beats.)

         Both bridges are cut to the same measure — the environment leaves
         over 0.03, 0.01 passes with neither on screen, and the next
         arrives over 0.04. Mist I used to run 0.17 against Mist II's 0.11,
         which is why the descent stalled on the way to the forest and not
         on the way to the river. A film does not change its cutting rhythm
         halfway through.

         ── AND WHY BOTH ARE SHORTER THAN THEY WERE ──────────────────
         Each bridge ran 0.14 and now runs 0.10. At 0.14 the fog was the
         longest single held state in the piece apart from the chapters
         themselves, which inverted the intent: the reader spent more
         scroll inside the punctuation than reading the sentence after it.
         The four beats reclaimed go to Forest and River, so both
         environments now hold long enough to be looked at.

         The two environments never coexist. The gap between them is the
         descent through cloud: long enough to register as a passage,
         short enough that it never becomes a chapter of its own. Fog is
         punctuation, not a paragraph. */

      // HERO — brand type clears early, well before the fixed navigation.
      tl.to(brandRef.current, { yPercent: -7, ease: "none", duration: 1 }, 0);
      tl.to(
        brandRef.current,
        { opacity: 0, ease: "power2.in", duration: 0.06 },
        0.06,
      );

      // MOUNTAIN — the chapter statement, over Fuji, with room to be read.
      if (mountainRef.current) {
        tl.fromTo(
          mountainRef.current,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, ease: "power2.out", duration: 0.05 },
          0.13,
        );
        tl.to(
          mountainRef.current,
          { opacity: 0, y: -22, ease: "power2.in", duration: 0.05 },
          0.27,
        );
      }

      const mist = mistRef.current;

      // TRANSITION — fog thickens, then the veil blooms to carry the cut.
      if (mist) {
        tl.to(mist, { opacity: 0.95, ease: "power2.in", duration: 0.04 }, 0.30);
        // Growing the plate reads as moving into the cloud rather than
        // having a cloud laid over the lens.
        tl.to(
          atmosphereRef.current,
          { scale: 1.3, ease: "power1.inOut", duration: 0.08 },
          0.30,
        );
        tl.to(
          atmosphereRef.current,
          { scale: 1.1, ease: "power1.inOut", duration: 0.08 },
          0.375,
        );
      }
      tl.to(
        veilRef.current,
        { opacity: 0.68, ease: "power2.inOut", duration: 0.04 },
        0.305,
      );

      // Fuji dissolves inside the bloom and is fully gone by 0.35.
      tl.to(
        envRef.current,
        { opacity: 0, ease: "power1.in", duration: 0.03 },
        0.32,
      );

      // 0.35 to 0.36 carries no tween on either environment. Atmosphere
      // only, and only for that sliver of a beat.

      // FOREST — emerges from the same fog that swallowed the mountain.
      if (forestPlaneRef.current) {
        tl.to(
          forestPlaneRef.current,
          { opacity: 1, ease: "power1.out", duration: 0.04 },
          0.36,
        );
      }
      tl.to(
        veilRef.current,
        { opacity: 0, ease: "power2.inOut", duration: 0.05 },
        0.365,
      );
      if (mist) {
        tl.to(mist, { opacity: 0.26, ease: "power2.out", duration: 0.06 }, 0.375);
      }

      /* The whole darkening stack stands down inside fog.

         This is what was making the cloud beats read as murk rather than
         weather. Three layers exist to serve an environment with a subject
         and type over it: a multiply wash for the sky, a dark radial pool
         behind the headline, and a vignette for depth. In fog there is no
         subject, no type and no depth — but all three were still at full
         strength, and the pool in particular painted a dark ellipse across
         the middle of a frame that should have been its brightest.

         They return the moment an environment does. */
      if (glowRef.current) {
        tl.to(glowRef.current, { opacity: 1, ease: "power2.in", duration: 0.06 }, 0.305);
        tl.to(glowRef.current, { opacity: 0, ease: "power2.out", duration: 0.06 }, 0.395);
        tl.to(glowRef.current, { opacity: 0.9, ease: "power2.in", duration: 0.04 }, 0.665);
        tl.to(glowRef.current, { opacity: 0, ease: "power2.out", duration: 0.05 }, 0.735);
      }

      [poolRef, washRef, vignetteRef].forEach((r) => {
        if (!r.current) return;
        tl.to(r.current, { opacity: 0, ease: "power2.out", duration: 0.05 }, 0.30);
        tl.to(r.current, { opacity: 1, ease: "power2.in", duration: 0.05 }, 0.405);
        tl.to(r.current, { opacity: 0, ease: "power2.out", duration: 0.03 }, 0.66);
        tl.to(r.current, { opacity: 1, ease: "power2.in", duration: 0.04 }, 0.73);
      });

      // FOREST — its statement, over its own environment.
      if (forestTextRef.current) {
        tl.fromTo(
          forestTextRef.current,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, ease: "power2.out", duration: 0.05 },
          0.5,
        );
        tl.to(
          forestTextRef.current,
          { opacity: 0, y: -22, ease: "power2.in", duration: 0.05 },
          0.62,
        );
      }

      /* MIST II — the Forest to River bridge, deliberately identical in
         grammar to the first. A film does not change its transition
         vocabulary halfway through; using the same optical twice is what
         makes the three environments read as one continuous piece rather
         than three clips. */
      if (mist) {
        tl.to(mist, { opacity: 0.95, ease: "power2.in", duration: 0.04 }, 0.66);
        tl.to(
          atmosphereRef.current,
          { scale: 1.3, ease: "power1.inOut", duration: 0.08 },
          0.66,
        );
        tl.to(
          atmosphereRef.current,
          { scale: 1.1, ease: "power1.inOut", duration: 0.08 },
          0.735,
        );
      }
      tl.to(
        veilRef.current,
        { opacity: 0.68, ease: "power2.inOut", duration: 0.04 },
        0.665,
      );
      if (forestPlaneRef.current) {
        tl.to(
          forestPlaneRef.current,
          { opacity: 0, ease: "power1.in", duration: 0.03 },
          0.68,
        );
      }
      if (riverPlaneRef.current) {
        tl.to(
          riverPlaneRef.current,
          { opacity: 1, ease: "power1.out", duration: 0.04 },
          0.72,
        );
      }
      tl.to(
        veilRef.current,
        { opacity: 0, ease: "power2.inOut", duration: 0.05 },
        0.725,
      );
      if (mist) {
        tl.to(mist, { opacity: 0.26, ease: "power2.out", duration: 0.06 }, 0.735);
      }

      // RIVER — its statement, over its own environment.
      if (riverTextRef.current) {
        tl.fromTo(
          riverTextRef.current,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, ease: "power2.out", duration: 0.05 },
          0.83,
        );
        tl.to(
          riverTextRef.current,
          { opacity: 0, y: -22, ease: "power2.in", duration: 0.06 },
          0.9,
        );
      }

      /* THE HAND-OFF.

         The film must not simply stop. The river settles toward ink — the
         colour the editorial sections are already built on — so the last
         frame of the film and the first frame of the argument are the same
         value. Nothing cuts; the environment darkens into the page.

         Then a single bronze hairline draws left to right, in the river's
         own direction of flow and at its own unhurried easing. It is the
         current, abstracted. Philosophy opens on the identical rule, so the
         line the visitor last saw moving is the line the argument begins
         with. That is the join: not a transition effect, a continuity of
         one graphic idea across the seam. */
      if (riverPlaneRef.current) {
        tl.to(
          riverPlaneRef.current,
          { opacity: 0.12, ease: "power2.inOut", duration: 0.1 },
          0.9,
        );
      }
      if (currentRef.current) {
        tl.fromTo(
          currentRef.current,
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, ease: "power2.inOut", duration: 0.08 },
          0.92,
        );
      }
    }, root);

    // The section is 260vh and its plates load asynchronously, so the
    // scroll distance ScrollTrigger measured at creation is not the final
    // one. Refresh after layout settles, and again once the mist video
    // reports real dimensions.
    ScrollTrigger.refresh();
    const mist = mistRef.current;
    const onMeta = () => ScrollTrigger.refresh();
    mist?.addEventListener("loadedmetadata", onMeta);

    return () => {
      mist?.removeEventListener("loadedmetadata", onMeta);
      ctx.revert();
    };
  }, [ready, targetWidth, forest]);

  return (
    // 5.2 viewports tall with a sticky stage inside. The length is the
    // pacing: the mountain gets a long hold, and the descent through cloud
    // is travelled through rather than triggered. Still one section — hero
    // and Mountain are one environment, and the forest is a plane in the
    // same film, never a separate page section.
    <section
      ref={rootRef}
      id="top"
      aria-label="Taizan Capital — introduction"
      className="relative h-[820vh] bg-ink"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
      {/* 2 — Environment, carrying the grade.
          The grade lives on the plane, not the composite, so the type and
          logo above stay unfiltered. Values are deliberately conservative:
          a touch more contrast for the cinematic floor, saturation eased
          back so the snow reads ivory rather than digital blue-white, and
          the natural colour left otherwise alone. */}
      <div
        ref={envRef}
        data-parallax-layer="environment"
        className="absolute inset-0 will-change-transform"
        style={{ filter: GRADE.fuji.filter }}
      >
        <LayerPlate layer={HERO_LAYERS[1]} targetWidth={targetWidth} />
        <Tint colour={GRADE.fuji.tint} />
      </div>

      {/* 2b — Forest. Sits directly above Fuji and is revealed underneath the
          mist whiteout, so the visitor never sees a cut — only the mountain
          vanishing into cloud and the forest emerging from the same cloud.
          No parallax and no scale: this footage already carries a moving
          camera and shallow depth of field, and adding our own would fight
          the optics we paid for. */}
      <div
        ref={forestPlaneRef}
        data-forest-plane
        className="absolute inset-0 opacity-0 will-change-[opacity]"
      >
        {forestMounted && forest ? (
          <video
            ref={forestRef}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: GRADE.forest.filter }}
            muted
            loop
            playsInline
            preload="none"
          >
            {forest.map((r) => (
              <source key={r.src} src={mediaUrl(r.src)} type={r.type} />
            ))}
          </video>
        ) : null}
        {forestMounted && forest ? <Tint colour={GRADE.forest.tint} /> : null}
      </div>

      {/* 2c — River. Same rule as the forest: mounted late, revealed under
          the second mist bridge, no parallax of our own over footage that
          already moves. */}
      <div
        ref={riverPlaneRef}
        data-river-plane
        className="absolute inset-0 opacity-0 will-change-[opacity]"
      >
        {riverMounted && river ? (
          <video
            ref={riverRef}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: GRADE.river.filter }}
            muted
            loop
            playsInline
            preload="none"
          >
            {river.map((r) => (
              <source key={r.src} src={mediaUrl(r.src)} type={r.type} />
            ))}
          </video>
        ) : null}
        {riverMounted && river ? <Tint colour={GRADE.river.tint} /> : null}
      </div>

      {/* 1 — Atmosphere. Sits above the environment because haze is between
          the viewer and the mountain, not behind it. It travels least of
          any plane, so it reads as distant air rather than passing cloud. */}
      <div
        ref={atmosphereRef}
        data-parallax-layer="atmosphere"
        className="absolute inset-0 scale-110 will-change-transform"
      >
        <LayerPlate
          layer={HERO_LAYERS[0]}
          targetWidth={targetWidth}
          videoRef={mistRef}
        />
      </div>

      {/* A lift, not the whiteout.

          This started as the thing that carried the cut, at 0.96 opacity —
          and a flat colour fill at 0.96 is a painted card. It flattened the
          mist footage underneath it completely and the vignette drew a ring
          around the result.

          Its job now is only to raise the black floor so the mist plate has
          something to screen against. The density comes from the footage,
          which has texture and movement. */}
      <div
        ref={veilRef}
        data-fog-veil
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 will-change-[opacity]"
        style={{ backgroundColor: "#eceeed" }}
      />

      {/* ── Cinematic treatment stack, bottom to top ──
          Every overlay is transparent across the middle of the frame; the
          footage stays the visual. */}

      {/* Tonal wash — cools the shadows toward ink, leaves highlights alone */}
      <div
        aria-hidden="true"
        ref={washRef}
        className="absolute inset-0 mix-blend-multiply"
        style={{
          background:
            "linear-gradient(180deg, rgba(14,16,18,0.35) 0%, transparent 30%, transparent 62%, rgba(10,10,10,0.5) 100%)",
        }}
      />

      {/* Legibility: a tight pool sized to the type block, plus a wide
          feather so it has no visible edge. Concentrating the darkening
          where the words are — rather than spreading it thinly across the
          frame — means the mountain and snow read brighter than they did
          with the broader, weaker version this replaces. */}
      <div
        ref={poolRef}
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 46% 33% at 50% 43%, rgba(10,10,10,0.60), rgba(10,10,10,0.30) 54%, transparent 78%)",
            "radial-gradient(ellipse 78% 58% at 50% 45%, rgba(10,10,10,0.16), transparent 76%)",
          ].join(","),
        }}
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

      {/* Vignette — pulls the corners in half a stop. Stands down inside
          the cloud beats: a vignette is a lens artefact, and inside fog
          there is no depth for it to describe. Left in, it draws a hard
          grey ring around a flat field and reads as a rendering bug. */}
      <div
        ref={vignetteRef}
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 45%, transparent 68%, rgba(10,10,10,0.42) 100%)",
        }}
      />

      {/* The current — drawn at the close, mirrored at the top of
          Philosophy so the graphic idea crosses the seam. */}
      {/* Centring lives on the wrapper, never on the animated node. GSAP
          writes the full transform when it animates scaleX, so a Tailwind
          -translate-x-1/2 on the same element would be silently discarded
          the moment the tween ran. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[18vh] z-20 flex justify-center"
      >
        <div
          ref={currentRef}
          data-current=""
          className="h-px w-[min(70vw,52rem)] origin-left opacity-0"
          style={{
            background:
              "linear-gradient(90deg, transparent, #c6a664 18%, #c6a664 82%, transparent)",
          }}
        />
      </div>

      {/* Sun through cloud.

          Grey fog and lit fog differ by one thing: a light source inside
          it. Without this the frame is an evenly filled field and the eye
          reads it as a flat surface; with it the brightness has a
          direction and the cloud gains volume. Positioned to match the sun
          the hero was graded for, so the light does not move when the
          mountain disappears into it. */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 62% 34%, rgba(255,247,232,0.95), rgba(246,238,224,0.45) 42%, transparent 74%)",
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

      {/* Anchor for "Begin the Descent". Sits at the point on the stage
          where the forest has resolved, so the button descends into the
          forest itself — not into fog, and not into another chapter. */}
      <span
        id="forest"
        aria-hidden="true"
        className="pointer-events-none absolute left-0 w-px"
        style={{ top: "84%", height: 1 }}
      />

      {/* Part 1 — Mountain. Same environment as the hero, so it lives on
          this stage rather than in a separate section that would render
          blank behind it. */}
      <div
        ref={mountainRef}
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center opacity-0"
      >
        <p className="hero-legible overline-label mb-7">01 — The Mountain</p>
        <h2 className="hero-legible max-w-4xl font-serif text-[clamp(2rem,5.5vw,4.4rem)] font-medium leading-[1.1] text-paper">
          Building wealth begins with strong foundations.
        </h2>
        <p className="hero-legible mt-7 max-w-lg text-sm font-light leading-relaxed text-paper sm:text-base">
          Permanence is not luck. It is what remains after everything
          unconsidered has been removed.
        </p>
      </div>

      {/* Part 2 — Forest. Same stage, same rules: the statement plays over
          its own environment and nowhere else. */}
      <div
        ref={forestTextRef}
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center opacity-0"
      >
        <p className="hero-legible overline-label mb-7">02 — The Forest</p>
        <h2 className="hero-legible max-w-4xl font-serif text-[clamp(1.8rem,4.6vw,3.6rem)] font-medium leading-[1.12] text-paper">
          Discipline and patience protect wealth.
        </h2>
        <p className="hero-legible mt-7 max-w-lg text-sm font-light leading-relaxed text-paper sm:text-base">
          A forest is planted in rows by people who will never sit in its
          shade. We invest the same way.
        </p>
      </div>

      {/* Part 3 — River. */}
      <div
        ref={riverTextRef}
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center opacity-0"
      >
        <p className="hero-legible overline-label mb-7">03 — The River</p>
        <h2 className="hero-legible max-w-4xl font-serif text-[clamp(1.8rem,4.6vw,3.6rem)] font-medium leading-[1.12] text-paper">
          Compounding rewards those who never interrupt it.
        </h2>
        <p className="hero-legible mt-7 max-w-lg text-sm font-light leading-relaxed text-paper sm:text-base">
          Water does not hurry, yet nothing withstands it. Continuous, patient
          force is how stone is carved.
        </p>
      </div>

      {/* 3 — Brand */}
      <div
        ref={brandRef}
        data-parallax-layer="brand"
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center will-change-transform"
      >
        {/* hero-legible is applied to the type, not the buttons — the solid
            button has dark text and would gain a halo from it. */}
        <p className="hero-legible overline-label mb-8">
          泰山資本 — The Great Mountain
        </p>
        <h1 className="hero-legible font-serif text-[clamp(2.4rem,7.2vw,7rem)] font-medium leading-[1.12] tracking-tight text-paper">
          {title}
        </h1>
        <p className="hero-legible mt-8 max-w-xl text-base font-light leading-relaxed text-paper sm:text-lg">
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
          href="#forest"
          className="hero-legible mt-16 flex flex-col items-center gap-3 text-paper-dim transition-colors duration-500 hover:text-gold"
        >
          <span className="text-[0.62rem] uppercase tracking-[0.34em]">
            Begin the Descent
          </span>
          <span className="block h-10 w-px bg-paper/15" aria-hidden="true" />
        </a>
      </div>

      {/* 4 — Foreground (nearest, fastest) */}
      <div
        ref={foregroundRef}
        data-parallax-layer="foreground"
        className="pointer-events-none absolute inset-0 z-20 scale-110 will-change-transform"
      >
        <LayerPlate layer={HERO_LAYERS[2]} targetWidth={targetWidth} />
      </div>
      </div>
    </section>
  );
}
