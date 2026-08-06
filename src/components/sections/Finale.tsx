"use client";

import SplitText from "@/components/animations/SplitText";
import Reveal from "@/components/animations/Reveal";
import MagneticButton from "@/components/ui/MagneticButton";

/**
 * The closing scene — the page returns to the 3D environment as the sun
 * rises over the mountain horizon.
 */
export default function Finale() {
  return (
    <section
      data-scene="fuji"
      aria-label="Closing"
      className="relative flex min-h-[130vh] flex-col items-center justify-center px-6 text-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-ink to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_62%_46%_at_50%_52%,rgba(10,10,10,0.66),rgba(10,10,10,0.2)_66%,transparent_84%)]"
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        <Reveal>
          <p className="overline-label mb-8">07 — The Horizon</p>
        </Reveal>
        <h2 className="font-serif text-[clamp(2.4rem,6vw,5rem)] font-medium leading-[1.1] text-paper">
          <SplitText text="Legacy is built" stagger={0.02} />
          <br />
          <SplitText
            text="one decision at a time."
            stagger={0.02}
            className="text-gold-bright"
          />
        </h2>
        <Reveal delay={0.3}>
          <p className="mx-auto mt-8 max-w-xl text-sm font-light leading-[1.9] text-paper-dim sm:text-base">
            When you are ready to think in generations, we are ready to
            listen. Conversations begin quietly, and without obligation.
          </p>
        </Reveal>
        <Reveal delay={0.5}>
          <div className="mt-12">
            <MagneticButton href="#contact">
              Begin the Conversation
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
