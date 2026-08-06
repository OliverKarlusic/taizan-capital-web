"use client";

import {
  useRef,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees. Keep small — luxury is restraint. */
  intensity?: number;
}

/**
 * Subtle 3D tilt with a travelling sheen. Perspective is applied on the
 * wrapper so the card itself can carry borders/backgrounds.
 */
export default function TiltCard({
  children,
  className = "",
  intensity = 4,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);

  const onMove = (e: ReactMouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * intensity;
    const ry = (px - 0.5) * intensity;
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    if (sheenRef.current) {
      sheenRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(212,184,118,0.10), transparent 55%)`;
      sheenRef.current.style.opacity = "1";
    }
  };

  const onLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "rotateX(0deg) rotateY(0deg)";
    if (sheenRef.current) sheenRef.current.style.opacity = "0";
  };

  return (
    <div style={{ perspective: "1100px" }} className="h-full">
      <div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={`relative h-full transition-transform duration-300 ease-out will-change-transform ${className}`}
      >
        <div
          ref={sheenRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
        />
        {children}
      </div>
    </div>
  );
}
