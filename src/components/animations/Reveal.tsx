"use client";

import {
  createElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in seconds. */
  delay?: number;
  as?: ElementType;
  className?: string;
  id?: string;
}

/**
 * Intersection-observed fade/rise reveal. CSS handles the transition (see
 * globals.css) so this stays cheap; reduced-motion users see content
 * immediately.
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // createElement rather than JSX: a polymorphic `as` collapses every
  // possible element's props to `never` under JSX type-checking.
  return createElement(
    Tag,
    {
      ref,
      id,
      "data-reveal": "",
      className,
      style: { "--reveal-delay": `${delay}s` } as CSSProperties,
    },
    children,
  );
}
