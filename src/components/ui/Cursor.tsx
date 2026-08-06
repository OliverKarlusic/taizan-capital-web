"use client";

import { useEffect, useRef } from "react";

/**
 * Minimal custom cursor: a gold dot with a trailing ring that expands over
 * interactive elements. Only mounts behaviour on fine pointers and steps
 * aside entirely for reduced-motion users.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!fine || reduced) return;

    document.body.dataset.customCursor = "true";

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let scale = 1;
    let targetScale = 1;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const interactive = (e.target as HTMLElement).closest(
        "a, button, [data-cursor='hover'], input, textarea, select, [role='button']",
      );
      targetScale = interactive ? 2.4 : 1;
    };

    const tick = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      scale += (targetScale - scale) * 0.14;
      dot.style.transform = `translate3d(${x - 3}px, ${y - 3}px, 0)`;
      ring.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      delete document.body.dataset.customCursor;
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] hidden md:block">
      <div
        ref={dotRef}
        className="absolute h-1.5 w-1.5 rounded-full bg-gold"
        style={{ transform: "translate3d(-100px,-100px,0)" }}
      />
      <div
        ref={ringRef}
        className="absolute h-9 w-9 rounded-full border border-gold/40"
        style={{
          transform: "translate3d(-100px,-100px,0)",
          transition: "border-color 0.3s ease",
        }}
      />
    </div>
  );
}
