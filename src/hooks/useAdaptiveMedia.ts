"use client";

import { useEffect, useState } from "react";

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
}

export interface AdaptiveMedia {
  /** False until mounted — SSR and hydration always agree on "posters only". */
  ready: boolean;
  /** Play video at all? False for data-saver, 2g, or reduced motion. */
  allowVideo: boolean;
  /** Display width in device pixels (capped) for rendition selection. */
  targetWidth: number;
}

/**
 * Decides how much media this visit can afford.
 *
 * Poster-first is the contract: everyone gets the still immediately, and
 * video is an upgrade applied only when the connection and the visitor's
 * preferences invite it. DPR is capped at 1.5 for selection — full-viewport
 * video behind a text scrim gains nothing visible above that, and the
 * bitrate cost is real.
 */
export function useAdaptiveMedia(): AdaptiveMedia {
  const [state, setState] = useState<AdaptiveMedia>({
    ready: false,
    allowVideo: false,
    targetWidth: 1280,
  });

  useEffect(() => {
    const compute = () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const conn = (
        navigator as Navigator & { connection?: NetworkInformationLike }
      ).connection;
      const constrained =
        conn?.saveData === true ||
        conn?.effectiveType === "2g" ||
        conn?.effectiveType === "slow-2g";

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      setState({
        ready: true,
        allowVideo: !reduced && !constrained,
        targetWidth: Math.round(window.innerWidth * dpr),
      });
    };

    compute();

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", compute);
    const conn = (
      navigator as Navigator & { connection?: NetworkInformationLike }
    ).connection;
    conn?.addEventListener?.("change", compute);
    window.addEventListener("resize", compute);

    return () => {
      mq.removeEventListener("change", compute);
      conn?.removeEventListener?.("change", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  return state;
}
