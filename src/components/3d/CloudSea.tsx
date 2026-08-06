"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/store";
import { dawnAmount, SUN_DIR } from "./Environment";

/**
 * Unkai — the sea of clouds. A deck below the summit plus a band of mist
 * that curls around the flanks.
 *
 * The deck is a flat plane, but it is shaded as if it were a height field:
 * the fragment shader samples its own noise three times to derive a normal,
 * then lights that normal with the scene's sun. The billows catch the
 * sunrise on their tops and fall to cool blue in their troughs, which is
 * what sells "above the clouds" from a shallow viewing angle.
 */

const NOISE_GLSL = /* glsl */ `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      s += a * noise(p);
      p = p * 2.07 + vec2(19.3, 7.7);
      a *= 0.5;
    }
    return s;
  }
`;

const DECK_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DECK_FRAG = /* glsl */ `
  varying vec3 vWorld;
  uniform float uTime;
  uniform float uDawn;
  uniform vec3 uSun;
  uniform vec3 uCamera;
  ${NOISE_GLSL}

  // Domain-warped cloud field — the warp is what turns generic fbm into
  // something that curls like weather.
  float clouds(vec2 p) {
    vec2 drift = vec2(uTime * 0.012, uTime * 0.005);
    vec2 q = vec2(fbm(p * 0.9 + drift), fbm(p * 0.9 + vec2(5.2, 1.3) - drift));
    return fbm(p + q * 1.4 + drift * 0.5);
  }

  void main() {
    vec2 p = vWorld.xz * 0.030;

    float h = clouds(p);
    // Finite-difference normal from the same field.
    float e = 0.06;
    float hx = clouds(p + vec2(e, 0.0));
    float hz = clouds(p + vec2(0.0, e));
    vec3 n = normalize(vec3((h - hx) * 4.5, 1.0, (h - hz) * 4.5));

    float diff = max(dot(n, uSun), 0.0);
    float rim = pow(max(dot(n, normalize(uSun + vec3(0.0, 0.55, 0.0))), 0.0), 3.0);

    vec3 shadow = vec3(0.52, 0.58, 0.66);   // cool blue trough
    vec3 lit    = vec3(0.94, 0.94, 0.93);   // snow-white top
    vec3 warm   = vec3(1.00, 0.90, 0.74);   // champagne catch-light

    vec3 col = mix(shadow, lit, smoothstep(0.05, 0.85, diff));
    col = mix(col, warm, rim * 0.45 * uDawn);
    col *= 0.80 + 0.30 * h;

    // Dissolve into the sky's horizon band well before the plane's own edge,
    // otherwise that edge reads as a hard seam across the sky.
    float d = distance(vWorld, uCamera);
    vec3 far = mix(vec3(0.46, 0.48, 0.51), vec3(0.72, 0.68, 0.60), uDawn);
    col = mix(col, far, smoothstep(150.0, 1100.0, d));

    gl_FragColor = vec4(col, 1.0);
  }
`;

const MIST_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const MIST_FRAG = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  uniform float uTime;
  uniform float uDawn;
  ${NOISE_GLSL}

  void main() {
    // Wraps the peak: u runs around the band, v runs up it.
    vec2 p = vec2(vUv.x * 9.0 + uTime * 0.020, vUv.y * 3.2 - uTime * 0.006);
    float m = fbm(p);
    m += fbm(p * 2.3 - vec2(uTime * 0.010, 0.0)) * 0.4;

    // Fade out top and bottom so the band has no visible edges.
    float band = smoothstep(0.0, 0.34, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
    float a = smoothstep(0.52, 0.95, m) * band * 0.4;

    vec3 col = mix(vec3(0.62, 0.67, 0.74), vec3(0.97, 0.93, 0.86), uDawn * 0.6);
    gl_FragColor = vec4(col, a);
  }
`;

export default function CloudSea() {
  const deck = useRef<THREE.ShaderMaterial>(null);
  const mist = useRef<THREE.ShaderMaterial>(null);

  useFrame((state, delta) => {
    const dawn = dawnAmount(scrollState.progress);
    const dt = scrollState.reducedMotion ? 0 : delta;
    if (deck.current) {
      deck.current.uniforms.uTime.value += dt;
      deck.current.uniforms.uDawn.value = dawn;
      deck.current.uniforms.uCamera.value.copy(state.camera.position);
    }
    if (mist.current) {
      mist.current.uniforms.uTime.value += dt;
      mist.current.uniforms.uDawn.value = dawn;
    }
  });

  return (
    <group>
      {/* The cloud deck */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -32, 0]}>
        <planeGeometry args={[5000, 5000, 1, 1]} />
        <shaderMaterial
          ref={deck}
          fog={false}
          vertexShader={DECK_VERT}
          fragmentShader={DECK_FRAG}
          uniforms={{
            uTime: { value: 0 },
            uDawn: { value: 0.55 },
            uSun: { value: SUN_DIR },
            uCamera: { value: new THREE.Vector3() },
          }}
        />
      </mesh>

      {/* Mist curling around the flanks at the cloud line */}
      <mesh position={[0, -25, 0]}>
        <cylinderGeometry args={[34, 50, 28, 64, 1, true]} />
        <shaderMaterial
          ref={mist}
          transparent
          depthWrite={false}
          fog={false}
          side={THREE.DoubleSide}
          vertexShader={MIST_VERT}
          fragmentShader={MIST_FRAG}
          uniforms={{
            uTime: { value: 0 },
            uDawn: { value: 0.55 },
          }}
        />
      </mesh>
    </group>
  );
}
