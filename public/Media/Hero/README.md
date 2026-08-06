# Hero footage — real licensed media only

This folder holds the three cinematic scenes behind the hero experience.
**Nothing generated goes in here** — licensed footage, professional
photography, nothing else. Until a scene's files exist, the site shows an
explicit sourcing slate in its place; it will never fake the shot.

## Folders

| Folder | Scene | Meaning |
|---|---|---|
| `01-fuji/` | Mount Fuji above clouds, sunrise aerial | Stability, legacy, perspective |
| `02-forest/` | Japanese cedar/bamboo forest | Patience, discipline, cultivation |
| `03-river/` | Clear water over stone | Compounding, continuous growth |

Each folder has a `SPEC.md` describing exactly what to license. Shot briefs
also live in code at `src/lib/media.ts`, which is the single place footage
gets connected.

## Files per scene

```
01-fuji/
  poster.avif        3840w still — first frame or best frame of the clip
  poster.jpg         same frame, JPEG fallback
  1920.webm          VP9/AV1, ~4–6 Mbps, audio stripped
  1920.mp4           H.264 high profile, ~6–8 Mbps, audio stripped  (Safari)
  1280.webm          ~2.5 Mbps
  1280.mp4           ~3.5 Mbps
  854.mp4            ~1.5 Mbps  (constrained mobile)
```

Loops: trim to a seamless loop if the licensor's clip allows; otherwise
leave head/tail intact and note it — the site loops with a hard cut today,
and slow cloud/water footage hides it well.

## Example ffmpeg ladder

```
ffmpeg -i master.mov -an -vf scale=1920:-2 -c:v libx264 -preset slow -crf 20 -movflags +faststart 1920.mp4
ffmpeg -i master.mov -an -vf scale=1920:-2 -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 1920.webm
ffmpeg -i master.mov -an -vf scale=1280:-2 -c:v libx264 -preset slow -crf 21 -movflags +faststart 1280.mp4
ffmpeg -i master.mov -an -vf scale=1280:-2 -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 1280.webm
ffmpeg -i master.mov -an -vf scale=854:-2  -c:v libx264 -preset slow -crf 23 -movflags +faststart 854.mp4
ffmpeg -i master.mov -vf "select=eq(n\,0),scale=3840:-2" -frames:v 1 poster.jpg
```

## Connecting a scene

In `src/lib/media.ts`, fill in the scene's entry:

```ts
poster: "/Media/hero/01-fuji/poster.avif",
renditions: [
  { src: "/Media/hero/01-fuji/854.mp4",  type: "video/mp4",  width: 854 },
  { src: "/Media/hero/01-fuji/1280.webm", type: "video/webm", width: 1280 },
  { src: "/Media/hero/01-fuji/1280.mp4",  type: "video/mp4",  width: 1280 },
  { src: "/Media/hero/01-fuji/1920.webm", type: "video/webm", width: 1920 },
  { src: "/Media/hero/01-fuji/1920.mp4",  type: "video/mp4",  width: 1920 },
],
credit: "Footage: <licensor>",   // if the licence requires attribution
```

That is the entire integration — no component changes.

## CDN delivery

Set `NEXT_PUBLIC_MEDIA_BASE=https://cdn.example.com/media` and every path
above resolves against the CDN instead of `/public`. Keep the same folder
layout on the CDN.

## Licensing

Keep proof of licence (invoice/licence PDF) for every clip in
`licences/` beside this file. Confirm web/commercial use, worldwide,
perpetual — "editorial only" clips cannot be used here.

## Where to source

Filmsupply, Artgrid (cinematic); Getty, Adobe Stock (breadth); Aflo and
amanaimages (deepest Mount Fuji aerial libraries — search 富士山 空撮 雲海).
Note: drone flight is restricted around Fuji (national park), so genuine
above-cloud aerials are helicopter/fixed-wing and priced accordingly.
