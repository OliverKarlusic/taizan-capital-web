"use client";

import dynamic from "next/dynamic";

/**
 * Client-side loader for the WebGL stage. The scene is code-split and never
 * server-rendered; a still gradient "poster" holds the frame while shaders
 * compile so the first paint is instant.
 */
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 bg-[linear-gradient(180deg,#0a1018_0%,#26313c_46%,#7c8794_72%,#b9b2a4_100%)]"
    />
  ),
});

export default function SceneLoader() {
  return <Scene />;
}
