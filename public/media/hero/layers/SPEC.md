# Hero parallax layers — real assets only

Four depth planes for `components/ui/cinematic-parallax-hero.tsx`.
Register files in `src/lib/media.ts` → `HERO_LAYERS`. No generated imagery.

| Plane | File | Travel | Asset required |
|---|---|---|---|
| 1 Atmosphere | `mist.webp` | 8% | Real morning haze / high cloud plate. **Alpha channel required** so it composites over the landscape. 2560w+ |
| 2 Environment | `fuji-background.mp4` (+ `.webm`, `clouds.webp` poster) | 22% | Real Mount Fuji landscape — silhouette above a cloud layer, sunrise light, atmospheric depth |
| 3 Brand | — | −14% | Typography, no asset |
| 4 Foreground | `forest.webp` | 55% | Real near-field elements — pine/maple branches, mist bank or rock texture. **Alpha channel required**, shot dark/backlit so it silhouettes. 2560w+ |

## Why alpha matters

Planes 1 and 4 sit *over* the landscape. Without a transparent background
they will occlude it and the parallax collapses into a slideshow. Cut them
from footage shot against sky, or commission them that way.

## Video plane (2)

Muted, `playsInline`, no audio track, `preload="metadata"`, poster always
supplied. Encode as in `../README.md`.

## Motion note

Travel values are intentionally small — the direction is "slow, elegant,
almost invisible". If the movement is noticeable as movement, it is wrong.
Nearer planes must always travel further than distant ones, or the depth
cue inverts and the scene reads as flat.
