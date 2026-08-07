#!/usr/bin/env node
/**
 * Media optimisation pipeline.
 *
 * Encodes every source video into a three-tier rendition ladder so the site
 * can serve a device the smallest file that still fills its screen. The
 * creative grade is untouched — this only changes delivery.
 *
 *   Usage:
 *     node scripts/encode-media.mjs                  # encode everything
 *     node scripts/encode-media.mjs mist-overlay     # one source
 *     node scripts/encode-media.mjs --force          # re-encode existing
 *
 * Sources are the *-master.mp4 files (or any mp4 without a tier suffix) in
 * public/media/hero. Output lands beside them as <name>-<width>.<ext>.
 *
 * Two codecs per tier: H.264 for universal support, VP9/WebM for the ~30%
 * smaller file modern browsers can take. The <video> element is given both
 * and picks the first it can play.
 *
 * Audio is stripped everywhere (-an). These are silent background plates and
 * an audio track is pure waste — it also trips autoplay heuristics.
 * -movflags +faststart puts the MP4 index at the front so playback can start
 * before the file has finished downloading.
 */

import { spawn } from "node:child_process";
import { readdir, stat, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const MEDIA_DIR = "public/media/hero";

/** The ladder. Width drives everything; CRF is tuned per tier. */
const TIERS = [
  { name: "desktop", width: 1920, crfH264: 23, crfVp9: 33 },
  { name: "tablet", width: 1280, crfH264: 25, crfVp9: 35 },
  { name: "mobile", width: 854, crfH264: 27, crfVp9: 37 },
];

const TIER_WIDTHS = new Set(TIERS.map((t) => String(t.width)));

function run(args, label) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let tail = "";
    p.stderr.on("data", (d) => {
      tail = (tail + d.toString()).slice(-2000);
    });
    p.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${label} failed (${code})\n${tail}`)),
    );
  });
}

const mb = (b) => (b / 1048576).toFixed(1);

async function sizeOf(f) {
  try {
    return (await stat(f)).size;
  } catch {
    return 0;
  }
}

/** Even dimensions are required by both encoders; -2 keeps the aspect ratio. */
const scale = (w) => `scale=${w}:-2:flags=lanczos`;

async function encodeOne(src, tier, force) {
  const dir = path.dirname(src);
  const base = path.basename(src, path.extname(src));
  const out = {
    mp4: path.join(dir, `${base}-${tier.width}.mp4`),
    webm: path.join(dir, `${base}-${tier.width}.webm`),
  };

  const wantWebm = process.argv.includes("--webm");

  if (!force && existsSync(out.mp4) && (!wantWebm || existsSync(out.webm))) {
    console.log(`    ${tier.name.padEnd(7)} skip (exists)`);
    return;
  }

  await run(
    [
      "-y", "-i", src,
      "-vf", scale(tier.width),
      "-c:v", "libx264",
      "-profile:v", "high",
      "-preset", "slow",
      "-crf", String(tier.crfH264),
      // Cap the buffer so a burst of motion can't spike past a phone's budget
      "-maxrate", `${Math.round(tier.width * 2.6)}k`,
      "-bufsize", `${Math.round(tier.width * 5.2)}k`,
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-an",
      out.mp4,
    ],
    `h264 ${tier.width}`,
  );

  // VP9 is roughly 30% smaller but 20-40x slower to encode from a 4K master
  // — hours for a full ladder on CPU. H.264 alone is universally supported,
  // so WebM is opt-in: run with --webm when there is time to spare, ideally
  // in CI rather than on a laptop.
  if (wantWebm) {
    await run(
      [
        "-y", "-i", src,
        "-vf", scale(tier.width),
        "-c:v", "libvpx-vp9",
        "-crf", String(tier.crfVp9),
        "-b:v", "0",
        "-row-mt", "1",
        "-deadline", "realtime",
        "-cpu-used", "5",
        "-pix_fmt", "yuv420p",
        "-an",
        out.webm,
      ],
      `vp9 ${tier.width}`,
    );
  }

  console.log(
    `    ${tier.name.padEnd(7)} mp4 ${mb(await sizeOf(out.mp4))} MB` +
      (wantWebm ? `  webm ${mb(await sizeOf(out.webm))} MB` : ""),
  );
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const filters = args.filter((a) => !a.startsWith("--"));

  await mkdir(MEDIA_DIR, { recursive: true });

  const sources = (await readdir(MEDIA_DIR))
    .filter((f) => f.endsWith(".mp4"))
    // Skip files that are themselves rendition output
    .filter((f) => {
      const m = f.match(/-(\d+)\.mp4$/);
      return !(m && TIER_WIDTHS.has(m[1]));
    })
    .filter((f) => !filters.length || filters.some((s) => f.includes(s)))
    .map((f) => path.join(MEDIA_DIR, f));

  if (!sources.length) {
    console.log("No source videos found in", MEDIA_DIR);
    return;
  }

  for (const src of sources) {
    console.log(`\n${path.basename(src)}  (${mb(await sizeOf(src))} MB master)`);
    for (const tier of TIERS) {
      await encodeOne(src, tier, force);
    }
  }

  console.log("\nDone. Register the renditions in src/lib/media.ts.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
