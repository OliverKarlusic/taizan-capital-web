"use client";

import { useEffect, useRef } from "react";
import { SCENES } from "@/lib/media";
import { useAdaptiveMedia } from "@/hooks/useAdaptiveMedia";
import ScenePlate from "./ScenePlate";
import Grade from "./Grade";

/**
 * The film stage — a fixed, full-viewport layer of real footage behind the
 * page, sequenced by scroll.
 *
 * Sections declare which scene backs them via data-scene="fuji|forest|river".
 * Each frame, the stage measures those sections and fades each scene's plate
 * by its proximity to the viewport, which produces documentary-style
 * cross-dissolves at every chapter boundary with no timeline to maintain:
 * the page layout IS the edit.
 *
 * Playback follows visibility with hysteresis — a plate's video plays only
 * while its layer is actually showing, so at most two of the clips decode
 * during a dissolve and none while the editorial sections cover the stage.
 */

/** Fade distance, as a fraction of viewport height, past a section's edge. */
const FADE_VH = 0.45;
const PLAY_ABOVE = 0.05;
const PAUSE_BELOW = 0.02;

export default function FilmStage() {
  const media = useAdaptiveMedia();
  const plateRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const playing = useRef<boolean[]>(SCENES.map(() => false));

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;

      const vh = window.innerHeight;
      const fade = vh * FADE_VH;
      const centre = vh / 2;

      SCENES.forEach((scene, i) => {
        const plate = plateRefs.current[i];
        if (!plate) return;

        // A scene may back several sections; take the strongest claim.
        let alpha = 0;
        document
          .querySelectorAll<HTMLElement>(`[data-scene="${scene.id}"]`)
          .forEach((section) => {
            const r = section.getBoundingClientRect();
            const dist =
              centre < r.top
                ? r.top - centre
                : centre > r.bottom
                  ? centre - r.bottom
                  : 0;
            const a = 1 - Math.min(dist / fade, 1);
            // smoothstep for an eased dissolve edge
            const eased = a * a * (3 - 2 * a);
            if (eased > alpha) alpha = eased;
          });

        plate.style.opacity = alpha.toFixed(3);

        const video = videoRefs.current[i];
        if (!video) return;
        if (alpha > PLAY_ABOVE && !playing.current[i]) {
          playing.current[i] = true;
          video.play().catch(() => {
            // Autoplay refused (e.g. iOS Low Power Mode): the poster stands.
            playing.current[i] = false;
          });
        } else if (alpha < PAUSE_BELOW && playing.current[i]) {
          playing.current[i] = false;
          video.pause();
        }
      });
    };

    raf = requestAnimationFrame(tick);

    const onHide = () => {
      if (!document.hidden) return;
      videoRefs.current.forEach((v, i) => {
        if (v && playing.current[i]) {
          v.pause();
          playing.current[i] = false;
        }
      });
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [media.allowVideo]);

  return (
    <div className="fixed inset-0 z-0 bg-ink" aria-hidden="true">
      {SCENES.map((scene, i) => (
        <ScenePlate
          key={scene.id}
          scene={scene}
          index={i}
          allowVideo={media.ready && media.allowVideo}
          targetWidth={media.targetWidth}
          ref={(el) => {
            plateRefs.current[i] = el;
          }}
          videoRef={(el) => {
            videoRefs.current[i] = el;
          }}
        />
      ))}
      <Grade />
    </div>
  );
}
