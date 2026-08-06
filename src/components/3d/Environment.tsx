"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/store";

/**
 * Shared sun direction. Low and off to the left so the light rakes across
 * the crater rim and throws long shadows down the gullies — the single most
 * important decision for making the summit read as three-dimensional.
 */
export const SUN_DIR = new THREE.Vector3(0.879, 0.242, -0.41).normalize();

/**
 * Dawn progression, 0.55 → 1. The sun is already up when the visitor
 * arrives; it simply climbs and warms as they descend the page.
 */
export function dawnAmount(progress: number): number {
  return 0.55 + 0.45 * THREE.MathUtils.smoothstep(progress, 0.55, 0.96);
}

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  varying vec3 vDir;
  uniform float uDawn;
  uniform vec3 uSun;

  void main() {
    vec3 dir = normalize(vDir);
    float h = clamp(dir.y, -0.25, 1.0);
    float sunDot = max(dot(dir, uSun), 0.0);

    // Cool, high-altitude gradient: near-black zenith through mountain grey
    // to a pale champagne band sitting on the cloud horizon.
    vec3 zenith  = vec3(0.020, 0.028, 0.042);
    vec3 mid     = mix(vec3(0.13, 0.17, 0.22), vec3(0.20, 0.25, 0.31), uDawn);
    vec3 horizon = mix(vec3(0.46, 0.48, 0.51), vec3(0.72, 0.68, 0.60), uDawn);

    vec3 col = mix(mid, zenith, smoothstep(0.02, 0.46, h));
    col = mix(horizon, col, smoothstep(-0.06, 0.18, h));

    // Mie forward-scattering around the sun — restrained, champagne not orange.
    float mie = pow(sunDot, 7.0);
    float wide = pow(sunDot, 2.0) * 0.22;
    col += vec3(0.95, 0.80, 0.58) * (mie * 0.55 + wide) * uDawn;

    // The sun itself, drawn into the dome so the summit occludes it correctly.
    float disc = smoothstep(0.99955, 0.99985, sunDot);
    col += vec3(1.0, 0.94, 0.82) * disc * 3.2 * uDawn;

    // Dither — a gradient this smooth bands badly on 8-bit displays.
    float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    col += (n - 0.5) * 0.006;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Environment() {
  const skyMat = useRef<THREE.ShaderMaterial>(null);

  useFrame(() => {
    if (skyMat.current) {
      skyMat.current.uniforms.uDawn.value = dawnAmount(scrollState.progress);
    }
  });

  return (
    <mesh renderOrder={-100}>
      <sphereGeometry args={[300, 40, 28]} />
      <shaderMaterial
        ref={skyMat}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        vertexShader={SKY_VERT}
        fragmentShader={SKY_FRAG}
        uniforms={{
          uDawn: { value: 0.55 },
          uSun: { value: SUN_DIR },
        }}
      />
    </mesh>
  );
}
