"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { fbm2 } from "@/lib/noise";

/**
 * The summit of Mount Fuji — crater rim and upper snowfields only.
 *
 * Built as a radial displacement mesh: a truncated volcanic cone whose
 * flanks fall away below the cloud deck, so the viewer only ever sees the
 * snow-covered peak. Two noise fields do the sculpting — an angular field
 * that carves Fuji's characteristic radial gullies (the furrows that run
 * straight down the cone), and a finer field for surface break-up.
 *
 * Snow and exposed volcanic rock are baked into vertex colours rather than
 * textures: no image downloads, no sampler cost, and the wind-scoured
 * pattern follows the geometry exactly.
 */

const THETA_SEG = 176;
const RADIAL_SEG = 104;

const R_OUTER = 100; // flank radius — well past the cloud line
const R_CRATER = 9.5; // crater rim radius
const CONE_DROP = 96; // vertical fall from rim to the base of the mesh

/**
 * Fuji's profile is concave: roughly 35° just below the crater and easing
 * as it descends. An exponent under 1 produces exactly that — and it is the
 * difference between a mountain and a dome, because a shallow cone lit by a
 * low sun has no surface steep enough to catch it.
 */
const CONE_EXP = 0.78;

const ROCK = new THREE.Color("#22252b");
const SCREE = new THREE.Color("#5b6068");
const SNOW = new THREE.Color("#eef2f6");
const SNOW_BLUE = new THREE.Color("#cddced");

/**
 * Angular gully field — constant along a radius, so furrows run straight
 * downslope. Fuji is a young, almost perfectly symmetric cone: the furrows
 * are many and shallow, not few and deep. Frequency high, amplitude low.
 */
function gullyAt(cx: number, sy: number): number {
  return fbm2(cx * 5.6 + 11.3, sy * 5.6 + 7.1, 4) - 0.5;
}

function heightAt(r: number, cx: number, sy: number): number {
  const gully = gullyAt(cx, sy);
  const fine = fbm2(cx * 11.5 + r * 0.055, sy * 11.5 + r * 0.055, 3) - 0.5;

  let h: number;
  if (r <= R_CRATER) {
    // Crater bowl, with a ragged inner wall.
    const t = r / R_CRATER;
    h = -4.4 * (1 - t * t) + gully * 1.2 * t;
  } else {
    // Outer flank: a concave cone, steepening as it descends.
    const t = (r - R_CRATER) / (R_OUTER - R_CRATER);
    h = -Math.pow(t, CONE_EXP) * CONE_DROP;
    h += gully * (0.9 + t * 6.0); // furrows deepen downslope
    h += fine * (0.35 + t * 1.6);
  }

  // Broken, wind-carved rim right at the crater lip.
  const rim = Math.exp(-Math.pow((r - R_CRATER) / 3.4, 2));
  h += gully * 1.3 * rim;

  return h;
}

function buildSummit(): THREE.BufferGeometry {
  const vertCount = (THETA_SEG + 1) * (RADIAL_SEG + 1);
  const positions = new Float32Array(vertCount * 3);
  const colors = new Float32Array(vertCount * 3);
  const indices: number[] = [];

  const c = new THREE.Color();

  for (let ti = 0; ti <= THETA_SEG; ti++) {
    const theta = (ti / THETA_SEG) * Math.PI * 2;
    const cx = Math.cos(theta);
    const sy = Math.sin(theta);
    const gully = gullyAt(cx, sy);
    // Rock exposure varies around the cone — one flank is more scoured.
    const scour = fbm2(cx * 13.7 + 3.2, sy * 13.7 + 3.2, 3);

    for (let ri = 0; ri <= RADIAL_SEG; ri++) {
      // Bias samples toward the rim, where the silhouette detail matters.
      const rt = Math.pow(ri / RADIAL_SEG, 1.35);
      const r = rt * R_OUTER;
      const h = heightAt(r, cx, sy);

      const idx = ti * (RADIAL_SEG + 1) + ri;
      positions[idx * 3] = cx * r;
      positions[idx * 3 + 1] = h;
      positions[idx * 3 + 2] = sy * r;

      // Snow line. Everything the viewer sees sits above the cloud deck and
      // therefore above the permanent snow line — rock only breaks through
      // where the wind scours the furrows bare, and on the lower flanks as
      // they descend out of frame.
      const byHeight = THREE.MathUtils.smoothstep(h, -54, -20);
      const exposure = THREE.MathUtils.clamp(
        byHeight - (1 - scour) * 0.26 + gully * 0.5,
        0,
        1,
      );

      if (exposure < 0.34) {
        c.copy(ROCK).lerp(SCREE, exposure / 0.34);
      } else {
        // Shaded snow reads faintly blue where it sits in the furrows.
        const shade = THREE.MathUtils.clamp(0.5 + gully * 1.7, 0, 1);
        c.copy(SNOW_BLUE).lerp(SNOW, shade);
        c.lerp(SCREE, Math.max(0, 1 - (exposure - 0.34) * 5) * 0.4);
      }

      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
    }
  }

  for (let ti = 0; ti < THETA_SEG; ti++) {
    for (let ri = 0; ri < RADIAL_SEG; ri++) {
      const a = ti * (RADIAL_SEG + 1) + ri;
      const b = a + RADIAL_SEG + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Snow and rock want opposite surface responses: wind-packed snow holds a
 * broad sheen, volcanic scoria is dead matte. Rather than pay for a second
 * material and a seam between them, derive roughness from the vertex colour
 * already baked into the mesh — bright vertices are snow, dark are rock.
 */
function patchRoughness(shader: { fragmentShader: string }) {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <roughnessmap_fragment>",
    /* glsl */ `
    #include <roughnessmap_fragment>
    {
      float snowiness = dot(vColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      roughnessFactor = mix(0.96, 0.44, smoothstep(0.16, 0.60, snowiness));
    }
    `,
  );
}

export default function FujiSummit() {
  const geometry = useMemo(buildSummit, []);

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.82}
        metalness={0}
        onBeforeCompile={patchRoughness}
      />
    </mesh>
  );
}
