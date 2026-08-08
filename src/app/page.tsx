import SmoothScroll from "@/components/animations/SmoothScroll";
import Cursor from "@/components/ui/Cursor";
import Navbar from "@/components/ui/Navbar";
import CinematicParallaxHero from "@/components/ui/cinematic-parallax-hero";
import Mandate from "@/components/sections/Mandate";
import Philosophy from "@/components/sections/Philosophy";
import Approach from "@/components/sections/Approach";
import Portfolio from "@/components/sections/Portfolio";
import Insights from "@/components/sections/Insights";
import About from "@/components/sections/About";
import Finale from "@/components/sections/Finale";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <SmoothScroll>
      <Cursor />
      <Navbar />
      <main id="main" className="relative">
        {/* The entire film — Mountain, Forest and River — is one stage on
            one timeline. There is no second cinematic system behind the
            editorial sections, and no chapter that can render without its
            environment. */}
        <CinematicParallaxHero />

        {/* The film ends; the argument begins. Mandate answers "what is
            this firm" before Philosophy explains how it thinks — the site
            previously assumed an answer it never gave. */}
        <Mandate />
        <Philosophy />
        <Approach />
        <Portfolio />
        <Insights />
        <About />

        {/* Return to the mountain for the close */}
        <Finale />
      </main>
      <Footer />

      {/* Grain, page-wide. It was previously confined to the film, so the
          texture dropped away the moment the editorial sections began and
          the two halves read as two different sites. Fixed, inert, and
          above everything so one surface treatment covers the whole
          document. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "240px 240px",
        }}
      />
    </SmoothScroll>
  );
}
