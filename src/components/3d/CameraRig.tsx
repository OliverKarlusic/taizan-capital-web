"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/store";

/**
 * Scroll-driven orbit around the summit.
 *
 * Two motions are layered. Scroll drives a keyframed push-in — the camera
 * closes on the crater rim and then lifts away toward the sunrise. On top of
 * that runs a constant, very slow azimuth creep (a full revolution takes
 * about eleven minutes) so the shot is never actually still, the way a long
 * lens on a documentary tripod is never actually still. Everything is
 * critically damped, so a flick of the scroll wheel eases rather than snaps.
 */

interface Key {
  p: number;
  radius: number;
  azimuth: number;
  height: number;
  targetY: number;
}

const KEYS: Key[] = [
  // The eye sits close to the height of the crater rim, not above it: the
  // peak then silhouettes against open sky with the cloud sea below, which
  // is the view from the summit rather than a view down onto a model of it.
  // targetY above the rim tilts the axis up so the peak sits low in frame
  // and the headline lands on clear sky.
  { p: 0.0, radius: 64, azimuth: 0.18, height: 6, targetY: 10 },
  { p: 0.3, radius: 56, azimuth: 0.62, height: 5, targetY: 5 },
  { p: 0.6, radius: 48, azimuth: 1.25, height: 3, targetY: 0 },
  { p: 0.82, radius: 60, azimuth: 1.9, height: 10, targetY: 5 },
  // Ends facing the sun's bearing, so the sunrise closes the journey.
  { p: 1.0, radius: 78, azimuth: 2.45, height: 20, targetY: 12 },
];

const smooth = (t: number) => t * t * (3 - 2 * t);

function sample(p: number, out: Key): Key {
  let a = KEYS[0];
  let b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (p >= KEYS[i].p && p <= KEYS[i + 1].p) {
      a = KEYS[i];
      b = KEYS[i + 1];
      break;
    }
  }
  const span = b.p - a.p;
  const t = span > 0 ? smooth(THREE.MathUtils.clamp((p - a.p) / span, 0, 1)) : 0;
  out.radius = THREE.MathUtils.lerp(a.radius, b.radius, t);
  out.azimuth = THREE.MathUtils.lerp(a.azimuth, b.azimuth, t);
  out.height = THREE.MathUtils.lerp(a.height, b.height, t);
  out.targetY = THREE.MathUtils.lerp(a.targetY, b.targetY, t);
  return out;
}

export default function CameraRig() {
  const eased = useRef(0);
  const look = useRef(new THREE.Vector3(0, -7, 0));
  const desiredPos = useMemo(() => new THREE.Vector3(), []);
  const desiredTgt = useMemo(() => new THREE.Vector3(), []);
  const frame = useMemo<Key>(
    () => ({ p: 0, radius: 96, azimuth: 0.18, height: 30, targetY: -7 }),
    [],
  );

  useFrame((state, delta) => {
    const { camera, clock } = state;
    const reduced = scrollState.reducedMotion;
    const dt = Math.min(delta, 1 / 20); // guard against tab-switch spikes

    eased.current = reduced
      ? scrollState.progress
      : THREE.MathUtils.damp(eased.current, scrollState.progress, 1.6, dt);

    const k = sample(THREE.MathUtils.clamp(eased.current, 0, 1), frame);

    // Documentary drift. Deliberately a bounded sway rather than a
    // continuous orbit: an unbounded creep would slowly carry the shot away
    // from every composition the keyframes were chosen for, so a visitor who
    // left the tab open would come back to a different — and unreviewed —
    // camera angle.
    const drift = reduced ? 0 : Math.sin(clock.elapsedTime * 0.043) * 0.075;
    const az = k.azimuth + drift;

    desiredPos.set(
      Math.cos(az) * k.radius,
      k.height,
      Math.sin(az) * k.radius,
    );
    desiredTgt.set(0, k.targetY, 0);

    if (!reduced) {
      const t = clock.elapsedTime;
      // Breathing — a handheld-tripod float, well under a degree.
      desiredPos.y += Math.sin(t * 0.31) * 0.55;
      desiredPos.x += Math.sin(t * 0.21) * 0.4;
      // Pointer parallax.
      desiredPos.x += scrollState.pointerX * 2.2;
      desiredPos.y += -scrollState.pointerY * 1.2;
      desiredTgt.x += scrollState.pointerX * 1.6;
      desiredTgt.y += -scrollState.pointerY * 0.9;
    }

    if (reduced) {
      camera.position.copy(desiredPos);
      look.current.copy(desiredTgt);
    } else {
      camera.position.lerp(desiredPos, 1 - Math.exp(-4.5 * dt));
      look.current.lerp(desiredTgt, 1 - Math.exp(-4.5 * dt));
    }
    camera.lookAt(look.current);
  });

  return null;
}
