"use client";

import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Vignette,
} from "@react-three/postprocessing";

/**
 * Cinematic finishing pass.
 *
 * Depth of field focuses on the crater rim, so the near flank and the far
 * cloud horizon both fall softly out — this is what separates a photograph
 * of a mountain from a render of one. Bloom is kept just above the sun's
 * luminance so only the sun and the brightest snow catch glare; anything
 * lower and the whole frame turns milky.
 *
 * Desktop only — see the quality gate in Scene.tsx.
 */
export default function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <DepthOfField
        target={[0, -4, 0]}
        focalLength={0.085}
        bokehScale={1.1}
        height={480}
      />
      <Bloom
        intensity={0.42}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.28}
        mipmapBlur
      />
      <Vignette offset={0.3} darkness={0.4} />
    </EffectComposer>
  );
}
