# Cinematic sequence — approved plan

Continue from here. Approved by the client; do not re-litigate the creative.

## The journey

One continuous film. **Hero and Part 1 — Mountain are the same environment**,
on one sticky stage driven by one scrubbed GSAP timeline.

| Beat | Progress | On screen |
|---|---|---|
| Hero | 0.00 – 0.16 | Fuji. Wordmark, tagline, CTAs. |
| Part 1 — Mountain | 0.16 – 0.44 | Fuji dominant. Brand type cleared. Chapter text resolves: *"Building wealth begins with strong foundations."* |
| Transition | 0.44 – 0.62 | Mist thickens, veil blooms. **Fuji reaches opacity 0 by 0.62.** |
| Inside the cloud | 0.62 – 0.74 | Neither mountain nor forest. Held, ~12% of scroll. |
| Part 2 — Forest | 0.74 – 1.00 | Forest resolves through clearing fog. Chapter text follows. |

Section height ≈ **520vh** so each beat gets real scroll distance.

### Hard rules

- **Fuji is fully gone before the forest has any opacity.** They never coexist.
- **The forest is never a layer underneath Fuji.** It mounts conditionally at
  ~0.50 progress, inside the veil — not at page load.
- The cloud beat is *held*, not passed through. It is the bridge between
  mountain (perspective, legacy) and forest (cultivation, growth).
- No new page section. No asset changes. No architectural rewrite.

## Known bugs to fix first

The mist bridge does not currently fire. Tweens at timeline position 0 (the
brand drift/dissolve) apply correctly; tweens at position ≥ 0.34 do not.
Two suspected causes, both unverified:

1. **The mist `<video>` carries `key={sources[0].src}`.** `useAdaptiveMedia`
   starts at a default width of 1280 and updates to the real viewport after
   mount, changing the key and **remounting the element**. The `gsap.context`
   effect has `deps: []`, so its tween holds a detached node.
2. **ScrollTrigger measurements are stale.** The section grew from `100vh` to
   `260vh` after the trigger was created. This is the likelier explanation for
   the veil and forest planes, which are static divs with stable identity and
   *should* have animated regardless of the video remount.

Note the asymmetry (position-0 tweens work, later ones do not) is the lead —
it points at stale scroll measurement rather than bad targets.

## First steps, in order

1. `git checkout -b cinematic-restructure`
2. **Fix the bug before restructuring.** Do not retime a timeline that isn't
   running — you will not be able to tell which change did what.
   - Remove `key={sources[0]?.src}` from the video in `LayerPlate`
     (`cinematic-parallax-hero.tsx`). Re-selecting a rendition on resize is
     not worth remounting a video mid-film.
   - Give the `gsap.context` effect a dependency on settled media state so it
     rebuilds after `useAdaptiveMedia` resolves.
   - Call `ScrollTrigger.refresh()` after setup.
   - Switch tween targets from selector strings to refs.
3. **Verify the bridge fires** before touching timings — probe opacity of
   mist / veil / Fuji / forest across scroll and confirm all four move.
   Programmatic `window.scrollTo` needs ~2s settle for Lenis to sync
   ScrollTrigger, otherwise reads are stale.
4. Retime to the five beats above; grow the section to ~520vh.
5. Move chapter 1's text out of `Journey.tsx` into the stage as a timed
   plate, so there is no separate Mountain section to render blank.
6. Remove the empty `fuji` scene registration from `SCENES` in
   `src/lib/media.ts` — Fuji lives in `HERO_LAYERS`, and the duplicate
   registration is what renders the blank Mountain section today.
7. Verify desktop and mobile at every beat boundary.

## State at handover

- Working: Fuji hero, mist atmosphere (screen blend, 0.22, masked to a band),
  grade, grain, vignette, per-glyph legibility, navbar collision fixed.
- Working: decode budget — forest loads at 24% progress, Fuji pauses past the
  whiteout point. Never more than two plates decoding.
- Working: encode pipeline (`node scripts/encode-media.mjs`), walks
  `public/media` recursively, three tiers, audio stripped, ffmpeg-static.
- **Not working:** the mist bridge. Site shows the Fuji hero with no
  transition; everything after it is dark.
- River (`public/media/river/river.mp4`, 4K, 13.1s, no audio) is normalised
  but not yet encoded or registered.

## Verification tooling

Headless Chrome over CDP on port 9222. Scripts live in the session scratchpad
(`shoot.mjs` for screenshots, `probe.mjs` for live DOM reads). Recreate as
needed — never trust a screenshot alone for whether an animation ran; read the
computed values.

Do not run `npm run build` while `next dev` is running. It wipes `.next` from
under the dev server and produces `ENOENT _buildManifest.js.tmp` failures that
look like application bugs.
