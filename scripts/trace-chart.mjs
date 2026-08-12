#!/usr/bin/env node
/**
 * Trace the supplied Growth Maximisation chart into a numeric series.
 *
 *   node scripts/trace-chart.mjs                 report what it finds
 *   node scripts/trace-chart.mjs --emit          write the data module
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────
 * The Growth Maximisation strategy has no transaction ledger, no
 * valuation series and no price history in this repository. The only
 * record of its performance is a single PNG render supplied by hand.
 *
 * That render was published as an image. It is accurate, but it is a
 * white raster on an ink-black site, it cannot scale, and on a phone its
 * axis labels come out under 4px. Redrawing it in the site's own idiom
 * means having numbers, and the only place numbers exist is inside the
 * image itself.
 *
 * So this measures the image. It is a deterministic reading of pixels
 * the user supplied — not an estimate of what the portfolio did, and not
 * a curve drawn to look plausible. Run it again on the same PNG and it
 * produces the same series. Replace the PNG and the series changes with
 * it. Nothing here is authored by hand.
 *
 * ── WHAT THIS IS NOT ────────────────────────────────────────────────
 * It is not a reconciliation. A traced curve inherits every limitation
 * of the render it came from and adds quantisation on top: the vertical
 * resolution is one pixel ≈ 0.36 percentage points, and where two lines
 * cross, the pixels of one are lost under the other. The output is
 * therefore a faithful reproduction of the CHART, and the chart remains
 * the source of truth. It is not, and must never be presented as, an
 * independent measurement of the PORTFOLIO.
 *
 * Zero dependencies — PNG decoding is implemented below against the
 * spec, because adding an image library to a website for one build-time
 * script is a poor trade.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(
  ROOT,
  "public/media/Charts and Graphs",
  "growth maximiation portfolio since inception 10 october 2023.png",
);
const OUT = path.join(ROOT, "src/data/growthMaximisationSeries.ts");

/* ── PNG decode ───────────────────────────────────────────────────── */

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");

  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error("interlaced PNG not supported");
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + len;
  }

  if (bitDepth !== 8) throw new Error(`bit depth ${bitDepth} not supported`);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`colour type ${colorType} not supported`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  // Undo the per-scanline filters. Spec: PNG 1.2 §6.
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const line = raw.subarray(rp, rp + stride);
    rp += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prior = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prior ? prior[i] : 0;
      const c = prior && i >= channels ? prior[i - channels] : 0;
      const x = line[i];
      let v;
      switch (filter) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error(`bad filter ${filter} on row ${y}`);
      }
      cur[i] = v & 0xff;
    }
  }

  return { width, height, channels, data: out };
}

const px = (img, x, y) => {
  const i = (y * img.width + x) * img.channels;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

/* ── colour matching ──────────────────────────────────────────────── */

/**
 * Saturated means "part of a plotted line". The chart's furniture —
 * gridlines, axis text, background — is grey or white, so a pixel with a
 * meaningful spread between its channels belongs to a series.
 */
const sat = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b);

const dist = (p, q) =>
  Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

/* ── main ─────────────────────────────────────────────────────────── */

const img = decodePng(fs.readFileSync(SRC));
console.log(`Source ${path.basename(SRC)} — ${img.width}x${img.height}`);

// 1. Find the distinct line colours by clustering saturated pixels.
const clusters = [];
for (let y = 0; y < img.height; y++) {
  for (let x = 0; x < img.width; x++) {
    const p = px(img, x, y);
    if (sat(p) < 60) continue;
    const hit = clusters.find((c) => dist(c.mean, p) < 48);
    if (hit) {
      hit.n++;
      for (let i = 0; i < 3; i++) hit.mean[i] += (p[i] - hit.mean[i]) / hit.n;
    } else {
      clusters.push({ mean: [...p], n: 1 });
    }
  }
}
clusters.sort((a, b) => b.n - a.n);
const series = clusters.filter((c) => c.n > 400).slice(0, 3);

console.log("\nLine colours found:");
for (const c of series) {
  console.log(
    `  rgb(${c.mean.map((v) => Math.round(v)).join(",")})  ${c.n} px`,
  );
}

// 2. Find the horizontal gridlines. They are the rows containing the most
//    near-uniform light-grey pixels across the plot area.
const gridRows = [];
for (let y = 0; y < img.height; y++) {
  let n = 0;
  for (let x = 0; x < img.width; x++) {
    const p = px(img, x, y);
    if (sat(p) < 14 && p[0] > 195 && p[0] < 246) n++;
  }
  if (n > img.width * 0.25) gridRows.push({ y, n });
}
// Collapse runs of adjacent rows into one line each.
const grid = [];
for (const r of gridRows) {
  const last = grid[grid.length - 1];
  if (last && r.y - last.y <= 2) continue;
  grid.push(r);
}

console.log(`\nGridlines at y = ${grid.map((g) => g.y).join(", ")}`);

/**
 * 3. Calibrate the vertical axis.
 *
 * The right-hand axis of the source reads +125 / +100 / +75 / +50 / +25 /
 * 0 / −25 per cent, evenly spaced. Gridline detection is reliable in the
 * upper half and noisy where the green area fill washes over the +25 line,
 * so the scale is fit from the four clean upper gridlines and the zero
 * line, by least squares, and the fit residual is printed. If the source
 * render ever changes and the gridlines stop being evenly spaced, this
 * will say so loudly rather than silently producing a wrong series.
 */
const ANCHORS = [
  { y: 30, pct: 125 },
  { y: 97, pct: 100 },
  { y: 163, pct: 75 },
  { y: 229, pct: 50 },
  { y: 361, pct: 0 },
].filter((a) => grid.some((g) => Math.abs(g.y - a.y) <= 2));

if (ANCHORS.length < 4) {
  throw new Error(
    `only ${ANCHORS.length} axis anchors matched detected gridlines — the ` +
      `source render has changed shape and the calibration must be redone`,
  );
}

const n = ANCHORS.length;
const sx = ANCHORS.reduce((a, p) => a + p.y, 0);
const sy = ANCHORS.reduce((a, p) => a + p.pct, 0);
const sxy = ANCHORS.reduce((a, p) => a + p.y * p.pct, 0);
const sxx = ANCHORS.reduce((a, p) => a + p.y * p.y, 0);
const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
const intercept = (sy - slope * sx) / n;
const toPct = (y) => slope * y + intercept;

const residual = Math.max(
  ...ANCHORS.map((a) => Math.abs(toPct(a.y) - a.pct)),
);
console.log(
  `\nAxis fit: ${(-slope).toFixed(5)} %/px, zero at y=${(-intercept / slope).toFixed(1)}` +
    `  (worst anchor residual ${residual.toFixed(3)} pp)`,
);
if (residual > 0.5) throw new Error("axis fit is not linear — refusing to emit");

/**
 * 4. Trace each series.
 *
 * The portfolio line is drawn green above zero and red below it — the
 * source recolours the same line rather than plotting two. Both are
 * therefore collected into one series. The benchmark is the purple line;
 * its lighter anti-aliasing colour is matched too, otherwise the trace
 * drops out wherever the line is steep and thinly covered.
 */
const PURPLE = series.find((c) => c.mean[2] > c.mean[0] && c.mean[2] > c.mean[1]);
const GREEN = series.find((c) => c.mean[1] > c.mean[0] && c.mean[1] > c.mean[2]);
if (!PURPLE || !GREEN) throw new Error("could not identify both line colours");

const isBenchmark = (p) => sat(p) >= 55 && p[2] > p[1] + 25 && p[2] > 120;
const isPortfolio = (p) =>
  (sat(p) >= 55 && p[1] > p[0] + 40 && p[1] > p[2] + 25) || // green
  (sat(p) >= 55 && p[0] > 150 && p[1] < 110 && p[2] < 110); // red, below zero

function trace(match) {
  const col = new Array(img.width).fill(null);
  for (let x = 0; x < img.width; x++) {
    let sum = 0;
    let count = 0;
    for (let y = 0; y < img.height; y++) {
      if (match(px(img, x, y))) {
        sum += y;
        count++;
      }
    }
    if (count) col[x] = sum / count;
  }
  return col;
}

const rawP = trace(isPortfolio);
const rawB = trace(isBenchmark);

const firstX = Math.min(rawP.findIndex(Boolean), rawB.findIndex(Boolean));
const lastX = Math.max(
  rawP.length - 1 - [...rawP].reverse().findIndex(Boolean),
  rawB.length - 1 - [...rawB].reverse().findIndex(Boolean),
);
console.log(`Plot area: x ${firstX} to ${lastX} (${lastX - firstX + 1}px wide)`);

/** Bridge columns where one line passes under the other. */
function fill(col) {
  const out = [...col];
  for (let x = firstX; x <= lastX; x++) {
    if (out[x] !== null) continue;
    let a = x - 1;
    while (a >= firstX && out[a] === null) a--;
    let b = x + 1;
    while (b <= lastX && out[b] === null) b++;
    if (a < firstX || b > lastX) { out[x] = out[a] ?? out[b]; continue; }
    out[x] = out[a] + ((out[b] - out[a]) * (x - a)) / (b - a);
  }
  return out;
}

const pCol = fill(rawP);
const bCol = fill(rawB);
const gapsP = rawP.slice(firstX, lastX + 1).filter((v) => v === null).length;
const gapsB = rawB.slice(firstX, lastX + 1).filter((v) => v === null).length;
console.log(`Columns bridged: portfolio ${gapsP}, benchmark ${gapsB}`);

/** 5. Downsample to a path the browser can draw without 1,500 nodes. */
const N = 200;
const points = [];
for (let i = 0; i < N; i++) {
  const x = Math.round(firstX + ((lastX - firstX) * i) / (N - 1));
  points.push({
    t: +(i / (N - 1)).toFixed(4),
    portfolio: +toPct(pCol[x]).toFixed(2),
    benchmark: +toPct(bCol[x]).toFixed(2),
  });
}

const last = points[points.length - 1];
const minP = Math.min(...points.map((p) => p.portfolio));
console.log(
  `\nTerminal: portfolio ${last.portfolio.toFixed(1)}%, benchmark ${last.benchmark.toFixed(1)}%`,
);
console.log(`Portfolio trough: ${minP.toFixed(1)}%`);
console.log(`Start: portfolio ${points[0].portfolio}%, benchmark ${points[0].benchmark}%`);

if (!process.argv.includes("--emit")) {
  console.log("\nDry run. Pass --emit to write", path.relative(ROOT, OUT));
  process.exit(0);
}

const body = `/**
 * Growth Maximisation — series traced from the supplied chart.
 *
 * ── GENERATED FILE. DO NOT EDIT BY HAND. ────────────────────────────
 * Produced by scripts/trace-chart.mjs from
 *   public/media/Charts and Graphs/
 *     growth maximiation portfolio since inception 10 october 2023.png
 * Re-run \`node scripts/trace-chart.mjs --emit\` to regenerate.
 *
 * ── WHAT THESE NUMBERS ARE ──────────────────────────────────────────
 * A pixel-level reading of the supplied render, calibrated against that
 * render's own right-hand axis (${(-slope).toFixed(5)} percentage points per
 * pixel). They are a faithful reproduction OF THE CHART. They are not an
 * independent measurement of the portfolio, and they carry every
 * limitation of the image plus quantisation of roughly ${Math.abs(slope).toFixed(2)}pp
 * per pixel row.
 *
 * There is no dated x-axis because the source has none. \`t\` runs 0 to 1
 * from inception to the end of the supplied record. Do not label
 * intermediate dates on it — the source does not support them.
 */

export interface TracedPoint {
  /** 0 at inception, 1 at the end of the supplied record. */
  t: number;
  /** Cumulative return, per cent. */
  portfolio: number;
  benchmark: number;
}

export const TRACED: TracedPoint[] = ${JSON.stringify(points, null, 2)
  .replace(/^\[/, "[")
  .replace(/\{\n\s+/g, "{ ")
  .replace(/,\n\s+/g, ", ")
  .replace(/\n\s+\}/g, " }")};

/** Terminal values of the traced series, for axis and label use. */
export const TRACED_TERMINAL = {
  portfolio: ${last.portfolio},
  benchmark: ${last.benchmark},
};

/** Deepest point of the early drawdown, traced. */
export const TRACED_TROUGH = ${minP};
`;

fs.writeFileSync(OUT, body);
console.log(`\nWrote ${path.relative(ROOT, OUT)} — ${points.length} points`);
