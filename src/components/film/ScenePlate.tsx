"use client";

/* eslint-disable @next/next/no-img-element -- full-viewport poster frames;
   next/image adds nothing over a preloaded plain element here. */

import { forwardRef } from "react";
import {
  hasFootage,
  mediaUrl,
  selectRenditions,
  type FilmScene,
} from "@/lib/media";

interface ScenePlateProps {
  scene: FilmScene;
  index: number;
  /** Render <source> tags at all — false on constrained connections. */
  allowVideo: boolean;
  /** Display width in device pixels, for rendition selection. */
  targetWidth: number;
  videoRef: (el: HTMLVideoElement | null) => void;
}

/**
 * One layer of the film stage: real licensed footage with its poster frame,
 * or — until that footage is connected — an explicit sourcing slate.
 *
 * The stage owns opacity and playback; this component owns markup. Video is
 * poster-first: preload="none" keeps the network quiet until the stage
 * actually plays the layer, and the poster below the video means there is
 * never a black flash while the first frame decodes.
 */
const ScenePlate = forwardRef<HTMLDivElement, ScenePlateProps>(
  function ScenePlate(
    { scene, index, allowVideo, targetWidth, videoRef },
    ref,
  ) {
    const footage = hasFootage(scene);
    const renditions = footage ? selectRenditions(scene, targetWidth) : [];

    return (
      <div
        ref={ref}
        className="absolute inset-0 will-change-[opacity]"
        style={{ opacity: index === 0 ? 1 : 0 }}
        aria-hidden="true"
      >
        {footage ? (
          <>
            {scene.poster ? (
              <img
                src={mediaUrl(scene.poster)}
                alt=""
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            {allowVideo && renditions.length ? (
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                muted
                loop
                playsInline
                disablePictureInPicture
                preload="none"
                poster={scene.poster ? mediaUrl(scene.poster) : undefined}
              >
                {renditions.map((r) => (
                  <source key={r.src} src={mediaUrl(r.src)} type={r.type} />
                ))}
              </video>
            ) : null}
            {scene.credit ? (
              <span className="absolute bottom-3 right-4 text-[0.6rem] tracking-wide text-paper/40">
                {scene.credit}
              </span>
            ) : null}
          </>
        ) : (
          // No footage yet: render a plain ink field. Never a sourcing card —
          // production must degrade to something quiet, not to instructions
          // addressed to the developer.
          <div className="absolute inset-0 bg-ink" />
        )}
      </div>
    );
  },
);

export default ScenePlate;
