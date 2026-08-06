"use client";

import { Suspense, lazy, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Environment from "./Environment";
import FujiSummit from "./FujiSummit";
import CloudSea from "./CloudSea";
import Particles from "./Particles";
import Lighting from "./Lighting";
import CameraRig from "./CameraRig";
import { scrollState } from "@/lib/store";

const Effects = lazy(() => import("./Effects"));

/**
 * The fixed, full-viewport WebGL stage behind the page: the summit of Mount
 * Fuji, seen from above the cloud line.
 *
 * Rendering pauses whenever the opaque editorial sections cover the canvas,
 * so the GPU is idle for most of the page. Shadows and the postprocessing
 * pass are desktop-only; phones get the same scene with a cheaper finish
 * rather than a different one.
 */
export default function Scene() {
  const [active, setActive] = useState(true);
  const [quality, setQuality] = useState(1);
  const [rich, setRich] = useState(false);

  useEffect(() => {
    const small = window.innerWidth < 900;
    const lowCore = navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency <= 4
      : false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setQuality(small || lowCore ? 0.4 : 1);
    setRich(!small && !lowCore && !reduced);

    const zones = document.querySelectorAll("[data-canvas-zone]");
    if (!zones.length) return;
    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        const on = visible.size > 0;
        setActive(on);
        scrollState.canvasVisible = on;
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    zones.forEach((z) => io.observe(z));
    return () => io.disconnect();
  }, []);

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, rich ? 1.75 : 1.4]}
        shadows={rich ? "soft" : false}
        camera={{
          fov: 40,
          near: 1,
          far: 700,
          position: [63, 6, 11.4],
        }}
        gl={{
          antialias: !rich, // the composer handles AA when effects are on
          powerPreference: "high-performance",
          alpha: false,
        }}
        onCreated={(state) => {
          state.gl.toneMapping = THREE.ACESFilmicToneMapping;
          state.gl.toneMappingExposure = 1.15;
          if (process.env.NODE_ENV === "development") {
            // Lets the frame be driven and captured manually during review.
            (window as unknown as Record<string, unknown>).__taizan = {
              state,
              scroll: scrollState,
            };
          }
        }}
      >
        <color attach="background" args={["#0a0a0a"]} />
        {/* Altitude haze — cool, and matched to the sky's horizon band */}
        <fogExp2 attach="fog" args={["#93a0ab", 0.0048]} />

        <Suspense fallback={null}>
          <Environment />
          <Lighting shadows={rich} />
          <FujiSummit />
          <CloudSea />
          <Particles quality={quality} />
          <CameraRig />
          {rich ? <Effects /> : null}
        </Suspense>
      </Canvas>
    </div>
  );
}
