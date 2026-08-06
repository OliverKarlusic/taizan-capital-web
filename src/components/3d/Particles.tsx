"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/store";

/**
 * Snow.
 *
 * Particles are positioned in a volume that travels with the camera, so the
 * viewer is always inside the weather no matter where the orbit has taken
 * them — the alternative (a fixed block of particles) either runs out or
 * costs a hundred times as many points. Wrapping happens in the vertex
 * shader via mod(), which means nothing is uploaded per frame.
 */

const VERT = /* glsl */ `
  attribute vec3 aCell;   // 0..1 position within the volume
  attribute float aSeed;

  uniform float uTime;
  uniform vec3  uCam;
  uniform vec3  uSize;    // volume dimensions
  uniform vec3  uWind;
  uniform float uFall;
  uniform float uFlutter;
  uniform float uPixelRatio;
  uniform float uScale;

  varying float vFade;

  void main() {
    vec3 span = uSize;

    // Drift the cell through the volume and wrap it.
    vec3 p;
    p.x = mod(aCell.x * span.x + uTime * uWind.x, span.x) - span.x * 0.5;
    p.y = mod(aCell.y * span.y - uTime * uFall,   span.y) - span.y * 0.5;
    p.z = mod(aCell.z * span.z + uTime * uWind.z, span.z) - span.z * 0.5;

    // Per-flake flutter so the fall never looks like a grid.
    float ph = aSeed * 6.2831;
    p.x += sin(uTime * (0.35 + aSeed * 0.4) + ph) * uFlutter;
    p.z += cos(uTime * (0.28 + aSeed * 0.4) + ph) * uFlutter;

    vec3 world = uCam + p;

    vec4 mv = viewMatrix * vec4(world, 1.0);
    float dist = max(-mv.z, 0.001);

    gl_PointSize = (uScale * (0.45 + aSeed) * uPixelRatio) / dist;
    gl_Position = projectionMatrix * mv;

    // Fade at the volume edges, and drop out anything nearly on the lens.
    vec3 edge = 1.0 - smoothstep(0.30, 0.5, abs(p / span));
    vFade = min(min(edge.x, edge.y), edge.z) * smoothstep(1.5, 6.0, dist);
  }
`;

const FRAG = /* glsl */ `
  varying float vFade;
  uniform float uOpacity;
  uniform vec3  uColor;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float a = smoothstep(0.5, 0.06, d) * vFade * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

interface SnowFieldProps {
  count: number;
  size: [number, number, number];
  wind: [number, number, number];
  fall: number;
  flutter: number;
  opacity: number;
  scale: number;
  color: string;
}

function SnowField({
  count,
  size,
  wind,
  fall,
  flutter,
  opacity,
  scale,
  color,
}: SnowFieldProps) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const { cells, seeds } = useMemo(() => {
    const cells = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      cells[i * 3] = Math.random();
      cells[i * 3 + 1] = Math.random();
      cells[i * 3 + 2] = Math.random();
      seeds[i] = Math.random();
    }
    return { cells, seeds };
  }, [count]);

  useFrame((state, delta) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    if (!scrollState.reducedMotion) u.uTime.value += delta;
    u.uCam.value.copy(state.camera.position);
    u.uPixelRatio.value = dpr;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-aCell" args={[cells, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        {/* position is unused by the shader but three requires it present */}
        <bufferAttribute attach="attributes-position" args={[cells, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        fog={false}
        blending={THREE.NormalBlending}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={{
          uTime: { value: Math.random() * 100 },
          uCam: { value: new THREE.Vector3() },
          uSize: { value: new THREE.Vector3(...size) },
          uWind: { value: new THREE.Vector3(...wind) },
          uFall: { value: fall },
          uFlutter: { value: flutter },
          uOpacity: { value: opacity },
          uScale: { value: scale },
          uPixelRatio: { value: 1 },
          uColor: { value: new THREE.Color(color) },
        }}
      />
    </points>
  );
}

export default function Particles({ quality = 1 }: { quality?: number }) {
  return (
    <group>
      {/* Ambient snowfall — slow, close, soft */}
      <SnowField
        count={Math.round(900 * quality)}
        size={[70, 46, 70]}
        wind={[1.1, 0, 0.7]}
        fall={1.5}
        flutter={0.85}
        opacity={0.62}
        scale={26}
        color="#f4f3ee"
      />
      {/* Spindrift — fine snow torn off the ridge by the wind */}
      <SnowField
        count={Math.round(500 * quality)}
        size={[150, 60, 150]}
        wind={[7.5, 0, 4.6]}
        fall={0.5}
        flutter={0.3}
        opacity={0.3}
        scale={13}
        color="#dfe7ee"
      />
    </group>
  );
}
