"use client";

import {
  createElement,
  useEffect,
  useMemo,
  useRef,
  type ElementType,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SplitTextProps {
  text: string;
  as?: ElementType;
  className?: string;
  /** Seconds before the stagger begins once visible. */
  delay?: number;
  /** Per-character stagger in seconds. */
  stagger?: number;
  /** If true, plays immediately on mount instead of on scroll. */
  immediate?: boolean;
}

/**
 * Word-wrapped character reveal. Characters rise out of an overflow mask with
 * a long luxurious ease. Screen readers get the intact string via aria-label.
 */
export default function SplitText({
  text,
  as: Tag = "span",
  className,
  delay = 0,
  stagger = 0.022,
  immediate = false,
}: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null);

  const words = useMemo(() => text.split(" "), [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const chars = el.querySelectorAll<HTMLElement>(".split-char");
    if (reduced) {
      chars.forEach((c) => {
        c.style.transform = "none";
        c.style.opacity = "1";
      });
      return;
    }

    const tween = gsap.to(chars, {
      y: 0,
      opacity: 1,
      duration: 1.4,
      ease: "power4.out",
      stagger,
      delay,
      paused: !immediate,
    });

    let st: ScrollTrigger | undefined;
    if (!immediate) {
      st = ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => tween.play(),
      });
    }

    return () => {
      st?.kill();
      tween.kill();
    };
  }, [delay, stagger, immediate, text]);

  // createElement rather than JSX: a polymorphic `as` collapses every
  // possible element's props to `never` under JSX type-checking.
  return createElement(
    Tag,
    { ref, className, "aria-label": text },
    words.map((word, wi) => (
      <span key={wi} aria-hidden="true" className="whitespace-nowrap">
        <span className="split-line-mask">
          {Array.from(word).map((ch, ci) => (
            <span key={ci} className="split-char">
              {ch}
            </span>
          ))}
        </span>
        {wi < words.length - 1 ? " " : null}
      </span>
    )),
  );
}
