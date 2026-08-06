"use client";

import {
  useRef,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";

interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "solid" | "outline";
  className?: string;
  ariaLabel?: string;
}

/**
 * A button that leans gently toward the pointer — restrained magnetism,
 * more Lexus than arcade. Falls back to a plain button for touch and
 * reduced-motion users (no hover, no harm).
 */
export default function MagneticButton({
  children,
  href,
  onClick,
  variant = "solid",
  className = "",
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement | null>(null);
  const inner = useRef<HTMLSpanElement | null>(null);

  const onMouseMove = (e: ReactMouseEvent) => {
    const el = ref.current;
    const label = inner.current;
    if (!el || !label) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.22}px)`;
    label.style.transform = `translate(${dx * 0.09}px, ${dy * 0.09}px)`;
  };

  const onMouseLeave = () => {
    const el = ref.current;
    const label = inner.current;
    if (!el || !label) return;
    el.style.transform = "translate(0, 0)";
    label.style.transform = "translate(0, 0)";
  };

  const base =
    "group relative inline-flex items-center gap-3 px-9 py-4 text-[0.72rem] font-medium uppercase tracking-[0.28em] transition-[transform,background-color,color,border-color,box-shadow] duration-500 will-change-transform";
  const styles =
    variant === "solid"
      ? "bg-gold text-ink hover:bg-gold-bright hover:shadow-[0_0_38px_rgba(198,166,100,0.35)]"
      : "border border-paper/25 text-paper hover:border-gold hover:text-gold-bright";

  const cls = `${base} ${styles} ${className}`;
  const content = (
    <span
      ref={inner}
      className="relative z-10 inline-flex items-center gap-3 transition-transform duration-500"
    >
      {children}
    </span>
  );

  if (href) {
    return (
      <a
        ref={(n) => {
          ref.current = n;
        }}
        href={href}
        aria-label={ariaLabel}
        className={cls}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      ref={(n) => {
        ref.current = n;
      }}
      type="button"
      aria-label={ariaLabel}
      className={cls}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {content}
    </button>
  );
}
