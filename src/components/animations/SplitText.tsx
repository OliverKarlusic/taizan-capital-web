"use client";

import {
  createElement,
  Fragment,
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
      // The separating space MUST sit outside the nowrap wrapper. A space
      // inside a `white-space: nowrap` element is not a line-break
      // opportunity, and since adjacent word spans have no whitespace
      // between them either, the whole string becomes one unbreakable line
      // that runs past narrow viewports. Emitting the space as a sibling in
      // the parent — whose white-space is normal — restores wrapping.
      //
      // The wrapper still needs nowrap: each character is its own
      // inline-block, and without it a word would break mid-word.
      <Fragment key={wi}>
        <span aria-hidden="true" className="whitespace-nowrap">
          <span className="split-line-mask">
            {Array.from(word).map((ch, ci) => (
              <span key={ci} className="split-char">
                {ch}
              </span>
            ))}
          </span>
        </span>
        {wi < words.length - 1 ? " " : null}
      </Fragment>
    )),
  );
}
