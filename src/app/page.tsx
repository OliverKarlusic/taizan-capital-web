import SmoothScroll from "@/components/animations/SmoothScroll";
import SceneLoader from "@/components/3d/SceneLoader";
import Cursor from "@/components/ui/Cursor";
import Navbar from "@/components/ui/Navbar";
import Hero from "@/components/sections/Hero";
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
      <SceneLoader />
      <Cursor />
      <Navbar />
      <main id="main" className="relative">
        {/* Transparent cinematic zone — the 3D environment shows through */}
        <div data-canvas-zone="">
          <Hero />
          <Journey />
        </div>

        {/* Editorial chapters over solid ink */}
        <Philosophy />
        <Approach />
        <Portfolio />
        <Insights />
        <About />

        {/* Return to the environment for the sunrise */}
        <div data-canvas-zone="">
          <Finale />
        </div>
      </main>
      <Footer />
    </SmoothScroll>
  );
}
