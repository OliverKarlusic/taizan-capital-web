import SmoothScroll from "@/components/animations/SmoothScroll";
import FilmStage from "@/components/film/FilmStage";
import Cursor from "@/components/ui/Cursor";
import Navbar from "@/components/ui/Navbar";
import CinematicParallaxHero from "@/components/ui/cinematic-parallax-hero";
import Journey from "@/components/sections/Journey";
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
      {/* Real licensed footage, sequenced by scroll. Sections declare their
          backing scene with data-scene; the stage cross-dissolves to match. */}
      <FilmStage />
      <Cursor />
      <Navbar />
      <main id="main" className="relative">
        {/* Layered parallax opening, then the film stage takes over */}
        <CinematicParallaxHero />
        <Journey />

        {/* Editorial chapters over solid ink */}
        <Philosophy />
        <Approach />
        <Portfolio />
        <Insights />
        <About />

        {/* Return to the mountain for the close */}
        <Finale />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
