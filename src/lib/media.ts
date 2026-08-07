/**
 * Media manifest — the single place real footage is connected to the site.
 *
 * Nothing here is generated, illustrative, or stand-in artwork. A scene with
 * an empty `renditions` array renders an explicit sourcing slate naming the
 * footage it still needs; the moment real files are added, that scene plays
 * instead. No other file has to change.
 *
 * ── Connecting footage ──────────────────────────────────────────────
 * 1. Encode the licensed master into the rendition ladder below.
 * 2. Drop the files in public/media/hero/<scene>/ (or upload to a CDN).
 * 3. Fill in `poster`, `renditions` and `credit`.
 *
 * ── Serving from a CDN ──────────────────────────────────────────────
 * Set NEXT_PUBLIC_MEDIA_BASE (e.g. https://cdn.taizan.example/media) and
 * every path below resolves against it. Leave it unset to serve the files
 * out of /public. Absolute URLs in `src` bypass the base entirely, so a
 * single scene can live on a different host during testing.
 */

export const MEDIA_BASE = (
  process.env.NEXT_PUBLIC_MEDIA_BASE ?? ""
).replace(/\/$/, "");

/** Resolve a manifest path against the configured media host. */
export function mediaUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${MEDIA_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface VideoRendition {
  /** Path under /public, or an absolute CDN URL. */
  src: string;
  /** Full MIME type. Include codecs so the browser can skip what it can't play. */
  type: string;
  /** Intrinsic pixel width — used to choose a rendition. */
  width: number;
}

/**
 * Exactly what real footage this slot needs. Shown on the sourcing slate and
 * written into the folder SPEC, so the brief cannot drift from the code.
 */
export interface FootageRequirement {
  shot: string;
  movement: string;
  light: string;
  duration: string;
  avoid: string;
}

export interface FilmScene {
  id: SceneId;
  kanji: string;
  /** Editorial label, e.g. "Mount Fuji". */
  title: string;
  /** What the scene means in the brand story. */
  meaning: string;
  /** Folder the files belong in, relative to /public. */
  folder: string;
  /** Still frame — the LCP element, shown before and instead of video. */
  poster: string | null;
  /** Ordered smallest → largest. Empty means "not yet sourced". */
  renditions: VideoRendition[];
  /** Licensor attribution, if the licence requires it. */
  credit: string | null;
  requirement: FootageRequirement;
}

export type SceneId = "fuji" | "forest" | "river";

/**
 * Scenes rendered by FilmStage behind the editorial chapters.
 *
 * Fuji is deliberately absent: it belongs to the hero stage via HERO_LAYERS,
 * and registering it here as well produced a second, empty Fuji scene that
 * rendered as a blank Mountain section behind chapter text.
 */
export const SCENES: FilmScene[] = [
  {
    id: "forest",
    kanji: "森",
    title: "Japanese Forest",
    meaning: "Patience, discipline, cultivation",
    folder: "/media/forest",
    poster: null,
    renditions: [
      { src: "/media/forest/forest-854.mp4", type: "video/mp4", width: 854 },
      { src: "/media/forest/forest-1280.mp4", type: "video/mp4", width: 1280 },
      { src: "/media/forest/forest-1920.mp4", type: "video/mp4", width: 1920 },
    ],
    credit: null,
    requirement: {
      shot: "Real footage inside a cedar or bamboo forest — tall straight trunks receding into mist, shafts of low light. Cultivated forest reads better than wild: the order in the planting is the point.",
      movement:
        "Slow dolly between trunks, a slow vertical tilt, or a locked hold with drifting mist. Stabilised.",
      light: "Early morning, soft and diffused, visible atmosphere.",
      duration: "12–25s usable; seamless loop preferred.",
      avoid:
        "People, paths with signage, autumn tourist colour, handheld shake, fast pans, dappled flicker that will strobe under text.",
    },
  },
  {
    id: "river",
    kanji: "川",
    title: "River",
    meaning: "Compounding, continuous growth",
    folder: "/media/river",
    poster: null,
    renditions: [
      { src: "/media/river/river-854.mp4", type: "video/mp4", width: 854 },
      { src: "/media/river/river-1280.mp4", type: "video/mp4", width: 1280 },
      { src: "/media/river/river-1920.mp4", type: "video/mp4", width: 1920 },
    ],
    credit: null,
    requirement: {
      shot: "Real footage of clear moving water over stone — a mountain stream or river. Mid or close framing where the flow is continuous and unbroken rather than turbulent.",
      movement:
        "Locked-off hold, or a very slow push. The motion should come from the water, not the camera.",
      light:
        "Overcast or early morning. Avoid harsh specular sparkle, which reads as stock footage.",
      duration: "12–25s usable; seamless loop strongly preferred.",
      avoid:
        "Waterfalls, whitewater, people, bridges, artificial channels, long-exposure silky-water effects, over-saturated turquoise grading.",
    },
  },
];

/* ── Hero parallax layers ───────────────────────────────────────────
   The four depth planes of the opening. Layer order is depth order:
   atmosphere sits furthest and travels least, foreground sits nearest
   and travels most, which is what sells movement through a landscape
   rather than a sliding backdrop.

   `src: null` renders a sourcing frame naming the asset required. As
   with the film scenes, nothing generated ever fills these slots.
   ─────────────────────────────────────────────────────────────────── */

export interface HeroLayer {
  id: "atmosphere" | "environment" | "foreground";
  /** Depth label for the sourcing frame. */
  label: string;
  /** Travel across the scroll, in % of viewport height. Nearer = more. */
  travel: number;
  /** Still image (webp/avif) under /public, or null while unsourced. */
  src: string | null;
  /**
   * Rendition ladder for this plane; takes precedence over `src`.
   * Each entry carries its intrinsic width so the right tier can be chosen
   * at runtime. Codec pairs share a width and travel together.
   */
  video: VideoRendition[] | null;
  /** Poster for the video plane. */
  poster: string | null;
  /** Exactly what real asset belongs here. */
  brief: string;
  /** mix-blend-mode used to composite this plane over the ones below. */
  blend?: string;
  /** Plane opacity. */
  opacity?: number;
  /** CSS filter applied to the plate before compositing. */
  filter?: string;
  /**
   * CSS mask-image. Lets an atmospheric plate be confined to part of the
   * frame instead of veiling all of it — essential for a full-frame fog
   * plate, which would otherwise erase the subject behind it.
   */
  mask?: string;
}

export const HERO_LAYERS: HeroLayer[] = [
  {
    id: "atmosphere",
    label: "Layer 1 — Atmosphere",
    travel: 8,
    src: null,
    // Real mist footage. This plate is dense fog filling the whole frame on
    // a light background — not wisps shot against black — so it cannot be
    // composited flat or it erases the mountain entirely. Three things make
    // it read as atmosphere instead of a veil:
    //
    //   filter  drops the base level so `screen` adds light only where the
    //           fog is genuinely brighter than its own average, rather than
    //           lifting the whole frame into milk;
    //   screen  is the physically right operator for haze, which is
    //           scattered light adding to the scene, never subtracting;
    //   mask    confines it to the lower band where the cloud sea already
    //           sits, so it reads as depth *between viewer and mountain*
    //           and leaves the summit and sky untouched.
    // Full ladder: mobile pulls 1.6 MB instead of the 62 MB master, and
    // keeps the identical blend, opacity, filter and mask. The layer is
    // never dropped on small screens — only the file changes.
    video: [
      { src: "/media/hero/mist-overlay-854.mp4", type: "video/mp4", width: 854 },
      { src: "/media/hero/mist-overlay-1280.mp4", type: "video/mp4", width: 1280 },
      { src: "/media/hero/mist-overlay-1920.mp4", type: "video/mp4", width: 1920 },
    ],
    poster: null,
    blend: "screen",
    opacity: 0.22,
    filter: "brightness(0.62) contrast(1.75) saturate(0.7)",
    mask: "linear-gradient(180deg, transparent 0%, transparent 34%, rgba(0,0,0,0.55) 58%, rgba(0,0,0,0.9) 78%, rgba(0,0,0,0.45) 100%)",
    brief:
      "Real morning haze / high cloud plate, wide and soft. Wisps shot against a dark sky composite most cleanly; a full-frame fog plate works but must be masked to a band.",
  },
  {
    id: "environment",
    label: "Layer 2 — Environment",
    travel: 22,
    // Real licensed hero footage. This is the primary visual — not a
    // placeholder, and never to be swapped for generated imagery.
    // Ladder is appended by scripts/encode-media.mjs; the 3840 master stays
    // listed as the top rung so the plane never has zero playable sources.
    video: [
      {
        src: "/media/hero/taizan-hero.mp4",
        type: "video/mp4",
        width: 3840,
      },
    ],
    src: null,
    poster: "/media/hero/hero-poster.jpg",
    brief:
      "Real Mount Fuji landscape — mountain silhouette above a cloud layer, sunrise light, atmospheric depth. Licensed footage (mp4/webm) preferred; a licensed still (webp, 3840w) is an acceptable substitute.",
  },
  {
    id: "foreground",
    label: "Layer 4 — Foreground",
    travel: 55,
    src: null,
    video: null,
    poster: null,
    brief:
      "Real near-field natural elements with alpha — pine or maple branches, mist bank, or rock texture, shot dark and backlit so it silhouettes. WebP/PNG with alpha, 2560w+.",
  },
];

/** True once any real asset has been connected for a hero layer. */
export function hasLayerAsset(layer: HeroLayer): boolean {
  return Boolean(layer.src) || Boolean(layer.video?.length);
}

export const SCENE_BY_ID = Object.fromEntries(
  SCENES.map((s) => [s.id, s]),
) as Record<SceneId, FilmScene>;

/** True once real footage has been connected for a scene. */
export function hasFootage(scene: FilmScene): boolean {
  return scene.renditions.length > 0;
}

/**
 * Narrow the rendition ladder for a given display width, so the browser is
 * never offered a 1080p file to fill a 480px phone. Chooses the smallest
 * ladder width that covers the display (or the largest available if none
 * does) and returns every rendition at that width — WebM/MP4 codec pairs
 * share a width and must travel together for <source> fallback to work.
 */
export function pickRenditions(
  renditions: VideoRendition[],
  displayWidth: number,
): VideoRendition[] {
  if (!renditions.length) return [];
  const widths = [...new Set(renditions.map((r) => r.width))].sort(
    (a, b) => a - b,
  );
  const target =
    widths.find((w) => w >= displayWidth) ?? widths[widths.length - 1];
  // WebM first: browsers take the first <source> they can play, and VP9 is
  // roughly 30% smaller than the H.264 at the same tier.
  return renditions
    .filter((r) => r.width === target)
    .sort((a) => (a.type.includes("webm") ? -1 : 1));
}

export function selectRenditions(
  scene: FilmScene,
  displayWidth: number,
): VideoRendition[] {
  return pickRenditions(scene.renditions, displayWidth);
}
