import type { FilmScene } from "@/lib/media";

/**
 * Sourcing slate — shown only while a scene has no licensed footage
 * connected.
 *
 * Deliberately styled as production tooling (an edit-suite "missing media"
 * tag), not as scenery: it must be impossible to mistake for a finished
 * design, and it must never fake the shot. It sits in the lower-left corner
 * so the section's own typography stays legible above it; the full shot
 * brief lives in the scene folder's SPEC.md and src/lib/media.ts. The slate
 * disappears the moment renditions are registered.
 */
export default function MediaSlate({
  scene,
  index,
}: {
  scene: FilmScene;
  index: number;
}) {
  return (
    <div className="absolute inset-0 bg-charcoal">
      {/* Reference checker: neutral, unmistakably technical */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-conic-gradient(#f4f3ee 0% 25%, transparent 0% 50%)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,rgba(10,10,10,0.7),transparent_100%)]"
      />

      <div className="absolute bottom-8 left-6 max-w-md border border-stone-dim/50 bg-ink/90 px-5 py-4 lg:left-10">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-gold">
          Scene {String(index + 1).padStart(2, "0")} · {scene.title}{" "}
          <span aria-hidden="true">{scene.kanji}</span> — awaiting licensed
          footage
        </p>
        <p className="mt-2 font-mono text-[0.62rem] leading-relaxed tracking-wide text-stone">
          Real footage only — no generated imagery. Shot brief:{" "}
          <span className="text-paper-dim">
            public{scene.folder}/SPEC.md
          </span>
          <br />
          Connect files via{" "}
          <span className="text-paper-dim">src/lib/media.ts</span>
        </p>
      </div>
    </div>
  );
}
