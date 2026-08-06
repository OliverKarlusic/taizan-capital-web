"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/store";
import { dawnAmount, SUN_DIR } from "./Environment";

/** Distance to park the key light at; only its direction matters. */
const SUN_DISTANCE = 160;

/**
 * Sunrise rig for the summit.
 *
 * Key light sits on SUN_DIR at a grazing elevation, which is what carves the
 * gullies into relief. The sky fills from above in ice blue and the cloud
 * deck bounces a soft champagne back up from below — snow in real mountain
 * light is never lit from one direction only, and skipping the bounce is
 * what makes CG snow look like plastic.
 */
export default function Lighting({ shadows = true }: { shadows?: boolean }) {
  const key = useRef<THREE.DirectionalLight>(null);
  const sky = useRef<THREE.HemisphereLight>(null);
  const bounce = useRef<THREE.DirectionalLight>(null);

  // Derived from SUN_DIR rather than assigned in an effect, so the light can
  // never drift out of agreement with the sky and cloud shaders that share
  // the same direction. Its target stays at the origin, where the peak is.
  const sunPosition = useMemo<[number, number, number]>(
    () => [
      SUN_DIR.x * SUN_DISTANCE,
      SUN_DIR.y * SUN_DISTANCE,
      SUN_DIR.z * SUN_DISTANCE,
    ],
    [],
  );

  useFrame(() => {
    const dawn = dawnAmount(scrollState.progress);
    if (key.current) key.current.intensity = 1.9 + dawn * 1.6;
    if (sky.current) sky.current.intensity = 0.9 + dawn * 0.3;
    if (bounce.current) bounce.current.intensity = 0.4 + dawn * 0.3;
  });

  return (
    <group>
      {/* Sun */}
      <directionalLight
        ref={key}
        position={sunPosition}
        color="#ffe9cc"
        intensity={2.0}
        castShadow={shadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={40}
        shadow-camera-far={330}
        shadow-camera-left={-130}
        shadow-camera-right={130}
        shadow-camera-top={130}
        shadow-camera-bottom={-130}
        shadow-bias={-0.0006}
        shadow-normalBias={0.9}
        shadow-radius={4}
      />

      {/* Sky dome fill — ice blue from above, volcanic dark from below */}
      <hemisphereLight
        ref={sky}
        args={["#b8d4e3", "#2b3138", 0.95]}
        position={[0, 60, 0]}
      />

      {/* Champagne bounce off the cloud deck */}
      <directionalLight
        ref={bounce}
        color="#f0dcc0"
        intensity={0.35}
        position={[30, -70, 45]}
      />

      {/* Cool counter-fill to keep shadow sides readable, not black */}
      <directionalLight color="#8fa6bd" intensity={0.5} position={[-60, 30, 70]} />

      <ambientLight color="#6b7784" intensity={0.3} />
    </group>
  );
}
