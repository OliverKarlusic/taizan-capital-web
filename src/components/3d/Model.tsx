"use client";

import { useGLTF } from "@react-three/drei";
import type * as THREE from "three";

interface ModelProps {
  /** Path to a GLB/GLTF asset (e.g. AI-generated or photogrammetry export). */
  src: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  castShadow?: boolean;
}

/**
 * Drop-in slot for external 3D assets — Blender exports, AI-generated GLBs or
 * photogrammetry scans. Place files under /public/models and reference them
 * as src="/models/asset.glb". Draco/meshopt-compressed files are supported by
 * drei's loader out of the box.
 */
export default function Model({
  src,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  castShadow = false,
}: ModelProps) {
  const { scene } = useGLTF(src);

  if (castShadow) {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  return (
    <primitive
      object={scene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

/** Warm a model into the loader cache before it enters the viewport. */
export function preloadModel(src: string) {
  useGLTF.preload(src);
}
