/**
 * Frame-rate-safe shared state for the cinematic experience.
 *
 * The 3D scene reads these values inside useFrame every frame; writing plain
 * mutable fields (instead of React state) avoids re-rendering the tree at
 * scroll speed.
 */
export const scrollState = {
  /** 0..1 progress through the whole document. */
  progress: 0,
  /** Lenis velocity, useful for motion accents. */
  velocity: 0,
  /** Whether the WebGL canvas is visible (hero/journey/finale on screen). */
  canvasVisible: true,
  /** Normalised pointer position, -1..1, for parallax. */
  pointerX: 0,
  pointerY: 0,
  /** True when the user prefers reduced motion. */
  reducedMotion: false,
};
