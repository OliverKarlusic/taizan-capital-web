#!/usr/bin/env node
/**
 * Front-end audit: text containment, navigation, media budget, and layout
 * sanity — run against the dev server across four viewports.
 *
 *   npm run audit                        every default route
 *   npm run audit -- /performance        one route
 *   npm run audit -- --url http://localhost:3100 /
 *
 * Exits non-zero if anything fails, so it can gate a deploy.
 *
 * ── WHY LAYOUT SANITY IS IN HERE ────────────────────────────────────
 * The containment checks alone once passed a section that was visibly
 * broken: a grid column had its span applied to the wrong element, so it
 * rendered 41px wide and 7346px tall, and the copy inside was a ribbon one
 * word per line. Nothing overflowed. No horizontal scroll appeared. Every
 * containment assertion was satisfied, at all four viewports, for several
 * runs in a row, while the page had a seven-thousand-pixel hole in it.
 *
 * Containment answers "does anything escape the frame". It has no opinion
 * on whether the layout is absurd. The three checks below cover that gap:
 * squeezed text blocks, grid children that lost their span, and reveal
 * animations that can never fire. Each maps to a real defect this project
 * shipped.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const VIEWPORTS = [
  [1920, 1080],
  [1440, 900],
  [834, 1112],
  [390, 844],
];

/* Every route that publishes a result gets checked at every viewport.
   The two equity strategy pages were missing here while carrying the
   heaviest layout on the site — a wide chart, a stats table and a
   multi-column method list. */
const DEFAULT_PATHS = [
  "/",
  "/performance",
  "/disclosures",
  "/portfolios/long-term-growth",
  "/portfolios/growth-maximisation",
  "/portfolios/options",
  // The Research Terminal renders its data client-side, so these are
  // checked in whatever state they reach by the audit's settle timeout —
  // which is the point. The shell, the filter bar and the tab strip must
  // lay out correctly before any data arrives, because that is what a
  // reader on a slow connection sees.
  "/research",
  "/research/MSFT",
  "/research/coverage",
  // Both open on an empty state for a visitor with nothing stored, which
  // is exactly the state worth checking: it is what every first-time
  // reader sees, and it is easy to leave unstyled.
  "/research/watchlist",
  "/research/thesis",
];

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

/* ── args ─────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
let base = "http://localhost:3000";
const paths = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--url") base = argv[++i];
  else paths.push(argv[i]);
}
const routes = paths.length > 0 ? paths : DEFAULT_PATHS;

/* ── chrome ───────────────────────────────────────────────────────── */

// Its own port and its own throwaway profile. An earlier version reused
// whatever browser happened to be on 9222, inherited a leftover
// setDeviceMetricsOverride from an ad-hoc debugging session, and audited
// all four viewports at 390px while reporting them as 1920, 1440 and 834.
// A verification tool that silently measures the wrong thing is worse than
// no verification tool.
const PORT = 9333;

const portOpen = () =>
  new Promise((resolve) => {
    const s = net
      .connect(PORT, "127.0.0.1")
      .on("connect", () => (s.destroy(), resolve(true)))
      .on("error", () => resolve(false));
    setTimeout(() => (s.destroy(), resolve(false)), 900);
  });

/**
 * Launch a dedicated browser. Never reuse one — see the note on PORT.
 *
 * Emulation.setDeviceMetricsOverride is deliberately not used for width:
 * it reports a viewport the page does not actually have (a 390 override
 * once measured innerWidth 954), which made a real mobile defect invisible
 * for two sessions. Each viewport gets a genuinely resized window instead.
 */
async function launchChrome() {
  if (await portOpen()) {
    console.error(
      `Something is already listening on ${PORT}. Close it — this script ` +
        `needs a clean browser with no emulation state.`,
    );
    process.exit(2);
  }

  const bin = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!bin) {
    console.error(
      "Chrome not found. Add its path to CHROME_CANDIDATES in this file.",
    );
    process.exit(2);
  }

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "taizan-audit-"));
  const child = spawn(
    bin,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "--headless=new",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "about:blank",
    ],
    { detached: true, stdio: "ignore" },
  );
  child.unref();

  for (let i = 0; i < 60; i++) {
    if (await portOpen()) return child;
    await new Promise((r) => setTimeout(r, 250));
  }
  console.error("Chrome did not expose a debugging port.");
  process.exit(2);
}

/* ── cdp ──────────────────────────────────────────────────────────── */

async function connect() {
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
  let target = targets.find((t) => t.type === "page");
  if (!target) {
    target = await (
      await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {
        method: "PUT",
      })
    ).json();
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };

  const send = (method, params) =>
    new Promise((res) => {
      pending.set(++id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.result?.exceptionDetails) {
      throw new Error(
        r.result.exceptionDetails.exception?.description ?? "eval failed",
      );
    }
    return r.result?.result?.value;
  };

  return { send, evaluate };
}

/**
 * Put the page at an exact viewport, and prove it.
 *
 * Browser.setWindowBounds sizes the *outer* window, which on this platform
 * runs about 22px wider than the viewport inside it, and Chrome refuses to
 * make a window narrower than roughly 500px at all — so a 390px phone
 * cannot be reached by resizing and needs a metrics override instead.
 *
 * Rather than hardcode either correction, measure and converge: resize,
 * read innerWidth, adjust by the error, read again. If the window simply
 * cannot go that narrow, fall back to the override. Every path ends in the
 * same measurement, and the caller asserts on it — so a viewport that
 * cannot be achieved is reported rather than quietly audited at the wrong
 * size, which is how a real mobile defect once survived two sessions.
 */
async function setViewport(send, evaluate, w, h) {
  await send("Emulation.clearDeviceMetricsOverride", {});
  const { windowId } = (await send("Browser.getWindowForTarget", {})).result;

  let padW = 0;
  let padH = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    await send("Browser.setWindowBounds", {
      windowId,
      bounds: { width: w + padW, height: h + padH, windowState: "normal" },
    });
    await new Promise((r) => setTimeout(r, 220));
    const got = await evaluate("JSON.stringify([innerWidth, innerHeight])");
    const [gw, gh] = JSON.parse(got);
    if (gw === w && gh === h) return { w: gw, h: gh, method: "window" };
    padW += w - gw;
    padH += h - gh;
  }

  // Below the platform's minimum window width. Override is the only way,
  // and the caller still verifies the result.
  await send("Emulation.setDeviceMetricsOverride", {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 220));
  const got = await evaluate("JSON.stringify([innerWidth, innerHeight])");
  const [gw, gh] = JSON.parse(got);
  return { w: gw, h: gh, method: "override" };
}

/* ── the in-page audit ────────────────────────────────────────────── */

/**
 * Runs inside the page. Scrolls the whole document, scanning at each step,
 * because a defect two thirds of the way down is invisible to a scan that
 * only ever looks at the top.
 */
const AUDIT = `(async function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const seen = new Set();
  const text = [];
  const layout = [];

  const label = (el) => {
    const t = (el.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 34);
    return el.tagName + (t ? ' "' + t + '"' : "");
  };
  const push = (bucket, key, msg) => {
    if (seen.has(key)) return;
    seen.add(key);
    bucket.push(msg);
  };

  /* ---- 1. text containment ---- */
  function scanText() {
    for (const el of document.querySelectorAll("h1,h2,h3,h4,p,li,dt,dd,button,a,span")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.05) continue;
      const t = (el.innerText || "").trim();
      if (!t || t.length < 3) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;

      const out = [];
      if (r.right > innerWidth + 1) out.push("right+" + Math.round(r.right - innerWidth));
      if (r.left < -1) out.push("left" + Math.round(r.left));
      if (cs.display !== "inline" && el.scrollWidth > el.clientWidth + 2) out.push("clipX");
      if (out.length) push(text, "t" + t.slice(0, 20) + out.join(), label(el) + " " + out.join());
    }
  }

  /* ---- 2. squeezed text blocks ----
     A block of real prose crammed into a sliver. Requires actual text and a
     strong tall-and-thin ratio, so icons, badges, rules and vertical labels
     do not trip it. This is the shape a lost grid span produces. */
  // The portfolio ring rotates its cards in 3D. getBoundingClientRect
  // returns the *projected* box, so a card turned edge-on measures a few
  // pixels wide while being perfectly legible when it faces the viewer.
  // Geometry cannot distinguish that from a squeezed column, so 3D
  // subtrees are excluded rather than reported every run.
  const in3d = (el) => {
    for (let n = el, i = 0; n && i < 8; n = n.parentElement, i++) {
      const cs = getComputedStyle(n);
      if (cs.transformStyle === "preserve-3d") return true;
      if (cs.transform && cs.transform.startsWith("matrix3d")) return true;
    }
    return false;
  };

  function scanSqueezed() {
    for (const el of document.querySelectorAll("p,h1,h2,h3,h4,li,dd,dt")) {
      if (in3d(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const t = (el.innerText || "").trim();
      if (t.length < 40) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;

      if (r.width < 140 && r.height > r.width * 5) {
        push(
          layout,
          "sq" + t.slice(0, 20),
          "squeezed " + label(el) + " — " + Math.round(r.width) + "x" +
            Math.round(r.height) + "px for " + t.length + " chars",
        );
      }
    }
  }

  /* ---- 3. grid children that lost their span ----
     In an explicit multi-column grid, a child sitting at \`auto\` while a
     sibling carries a span is almost always a utility class applied one
     level too deep — the exact defect that produced a 41px column. */
  function scanGrid() {
    for (const grid of document.querySelectorAll("*")) {
      const cs = getComputedStyle(grid);
      if (cs.display !== "grid" && cs.display !== "inline-grid") continue;
      const cols = cs.gridTemplateColumns.split(" ").filter(Boolean).length;
      if (cols < 2) continue;

      const kids = [...grid.children].filter(
        (k) => getComputedStyle(k).display !== "none",
      );
      const spanned = kids.filter(
        (k) => !getComputedStyle(k).gridColumn.startsWith("auto"),
      );
      if (spanned.length === 0 || spanned.length === kids.length) continue;

      for (const k of kids) {
        if (!getComputedStyle(k).gridColumn.startsWith("auto")) continue;
        const r = k.getBoundingClientRect();
        if (r.height === 0) continue;
        push(
          layout,
          "gr" + label(k),
          "grid child has no span while siblings do — " + label(k) +
            " (" + Math.round(r.width) + "px wide, " + cols + "-col grid)",
        );
      }
    }
  }

  /* ---- 4. reveals that can never fire ----
     Reveal fades in at 0.18 intersection. An element taller than the
     viewport / 0.18 can never reach that ratio, so it stays at opacity 0
     forever and reads as blank space. */
  function scanReveals() {
    const ceiling = innerHeight / 0.18;
    for (const el of document.querySelectorAll("[data-reveal]")) {
      const r = el.getBoundingClientRect();
      if (r.height === 0) continue;
      if (r.height > ceiling) {
        push(
          layout,
          "rvh" + label(el),
          "reveal too tall to ever intersect 18% — " + label(el) + " is " +
            Math.round(r.height) + "px, ceiling " + Math.round(ceiling) + "px",
        );
      }
    }
  }

  // Step by viewport, never by a fraction of the page. Percentage steps
  // scale with document height, so on a 20306px page a 5% step is a 973px
  // jump through an 844px window — leaving bands that are never rendered
  // into view, never scanned, and never given the chance to trigger an
  // IntersectionObserver. Overlapping 80% steps guarantee full coverage.
  const max = document.documentElement.scrollHeight - innerHeight;
  const step = Math.max(160, Math.round(innerHeight * 0.8));
  for (let y = 0; y <= max + step; y += step) {
    window.scrollTo({ top: Math.min(y, max), behavior: "instant" });
    await sleep(240);
    scanText();
    scanSqueezed();
    scanGrid();
    scanReveals();
  }

  // IntersectionObserver callbacks are asynchronous. Checking in the same
  // tick as the last scroll reports elements as never-revealed when their
  // callback is simply still queued.
  await sleep(700);

  /* ---- 5. reveals still hidden after the page has been scrolled past ----
     Checked once at the end: anything still un-revealed after the whole
     document has passed through the viewport is content nobody will see. */
  const stuck = [...document.querySelectorAll("[data-reveal]")]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.height > 0 && !el.classList.contains("is-revealed");
    })
    .map((el) => "reveal never fired — " + label(el));
  for (const s of stuck) push(layout, s, s);

  const anchors = [
    ...new Set(
      [...document.querySelectorAll("a[href^='#']")].map((a) =>
        a.getAttribute("href"),
      ),
    ),
  ];

  return JSON.stringify({
    vw: innerWidth,
    hScroll: document.documentElement.scrollWidth > innerWidth + 1,
    overflow: document.documentElement.scrollWidth - innerWidth,
    text,
    layout,
    deadAnchors: anchors.filter((h) => h !== "#" && !document.querySelector(h)),
    videos: document.querySelectorAll("video").length,
  });
})()`;

/* ── reachability ──────────────────────────────────────────────────
 * Every page that publishes something must be reachable by following
 * links from the homepage. This is the check that was missing: three
 * passes of "audit clean" while the results pages sat behind a card
 * carousel and the navigation link led to an empty table. Rendering
 * correctly and being findable are different properties, and only one of
 * them was ever tested.
 */
const MUST_BE_REACHABLE = [
  "/performance",
  "/disclosures",
  "/portfolios/long-term-growth",
  "/portfolios/passive-income",
  "/portfolios/growth-maximisation",
  "/portfolios/impact-investing",
  "/portfolios/options",
];

async function crawl(send, evaluate) {
  const seen = new Set(["/"]);
  const collect = async (route) => {
    await send("Page.navigate", { url: base + route });
    await new Promise((r) => setTimeout(r, route === "/" ? 7000 : 3000));
    const raw = await evaluate(`JSON.stringify([...new Set(
      [...document.querySelectorAll("a[href]")]
        .map((a) => a.getAttribute("href"))
        .filter((h) => h && h.startsWith("/") && !h.startsWith("//"))
        .map((h) => h.split("#")[0])
        .filter(Boolean)
    )])`);
    return JSON.parse(raw);
  };

  // Depth two: the homepage, then everything it links to. A page needing
  // three hops from home is not meaningfully findable anyway.
  const first = await collect("/");
  first.forEach((h) => seen.add(h));
  for (const route of first) {
    if (!route.startsWith("/portfolios") && route !== "/performance") continue;
    const next = await collect(route);
    next.forEach((h) => seen.add(h));
  }
  return seen;
}

/* ── run ──────────────────────────────────────────────────────────── */

const chrome = await launchChrome();
const { send, evaluate } = await connect();
await send("Page.enable", {});

let failures = 0;

if (paths.length === 0) {
  const reachable = await crawl(send, evaluate);
  const orphans = MUST_BE_REACHABLE.filter((r) => !reachable.has(r));
  console.log("");
  console.log("Reachability from the homepage");
  if (orphans.length === 0) {
    console.log(
      "  OK  all " + MUST_BE_REACHABLE.length +
        " published pages reachable within two hops",
    );
  } else {
    failures += orphans.length;
    for (const o of orphans) {
      console.log(
        "  FAIL  orphan  " + o +
          " - published but not linked from the homepage",
      );
    }
  }
}

for (const route of routes) {
  console.log(`\n\u001b[1m${route}\u001b[0m`);

  for (const [w, h] of VIEWPORTS) {
    // A real window resize, not a metrics override — see launchChrome().
    const vp = await setViewport(send, evaluate, w, h);
    await send("Page.navigate", { url: base + route });
    await new Promise((r) => setTimeout(r, route === "/" ? 7000 : 3500));

    // Trust nothing about the viewport — assert it. This is the check that
    // would have caught the stale-override bug immediately.
    const actual = await evaluate("innerWidth");
    if (Math.abs(actual - w) > 2 || Math.abs(vp.w - w) > 2) {
      console.log(
        `  [31m✗[0m ${`${w}x${h}`.padEnd(10)} HARNESS ERROR: ` +
          `asked for ${w}px, page reports ${actual}px. Results discarded.`,
      );
      failures++;
      continue;
    }

    const raw = await evaluate(AUDIT);
    const r = JSON.parse(raw);
    const problems = [
      ...r.text.map((m) => ["text", m]),
      ...r.layout.map((m) => ["layout", m]),
      ...r.deadAnchors.map((a) => ["nav", `dead anchor ${a}`]),
      ...(r.hScroll ? [["scroll", `horizontal overflow ${r.overflow}px`]] : []),
    ];

    const tag = `${w}x${h}`.padEnd(10);
    if (problems.length === 0) {
      console.log(`  \u001b[32m✓\u001b[0m ${tag} clean  (vw ${r.vw}, ${r.videos} video)`);
    } else {
      failures += problems.length;
      console.log(`  \u001b[31m✗\u001b[0m ${tag} ${problems.length} problem(s)`);
      for (const [kind, msg] of problems) {
        console.log(`      \u001b[33m${kind}\u001b[0m  ${msg}`);
      }
    }
  }
}

console.log(
  failures === 0
    ? "\n\u001b[32mAudit passed.\u001b[0m"
    : `\n\u001b[31mAudit failed: ${failures} problem(s).\u001b[0m`,
);

// Windows has no process groups to signal, and the browser may already
// have gone. Neither is a reason to fail the run.
if (chrome) {
  try {
    chrome.kill();
  } catch {
    /* already exited */
  }
}
process.exit(failures === 0 ? 0 : 1);
