import SmoothScroll from "@/components/animations/SmoothScroll";
import Cursor from "@/components/ui/Cursor";
import Navbar from "@/components/ui/Navbar";
import CinematicParallaxHero from "@/components/ui/cinematic-parallax-hero";
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
