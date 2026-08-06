/**
 * The grade — a unifying photographic finish laid over whichever scene is
 * playing, so three different licensors' footage reads as one film.
 *
 * Three layers, all CSS, all static markup:
 *  - film grain: SVG turbulence, animated by stepping its position, the way
 *    grain actually behaves (a new pattern each frame, never a drift)
 *  - vignette: pulls the frame edges down so the type owns the centre
 *  - base tint: a whisper of the brand's cool grade over everything
 *
 * Reduced-motion users get static grain via the global media query.
 */

const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>`;

export default function Grade() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* Cool base tint */}
      <div className="absolute inset-0 bg-[#0e1a26] opacity-[0.14] mix-blend-multiply" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_45%,transparent_55%,rgba(6,7,9,0.55)_100%)]" />

      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-[0.055] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,${GRAIN_SVG}")`,
          backgroundSize: "240px 240px",
          animation: "taizan-grain 0.9s steps(9) infinite",
        }}
      />

      <style>{`
        @keyframes taizan-grain {
          0% { background-position: 0 0; }
          11% { background-position: -37px 19px; }
          22% { background-position: 21px -41px; }
          33% { background-position: -58px -13px; }
          44% { background-position: 44px 27px; }
          55% { background-position: -19px 52px; }
          66% { background-position: 33px -29px; }
          77% { background-position: -47px -47px; }
          88% { background-position: 12px 38px; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
}
