import type { NextConfig } from "next";

/**
 * `next build` and `next dev` both write to .next by default, which means a
 * production build run while the dev server is up will delete and rewrite
 * the files the dev server is actively serving. The dev server does not
 * recover: it throws a stream of
 *   ENOENT ... .next/static/development/_buildManifest.js.tmp.*
 * and the page stops loading in the browser until it is restarted.
 *
 * Keying the output directory off the npm script that invoked it sends
 * builds to .next-build and leaves .next to the dev server alone. No
 * dependency, no flags to remember.
 */
const script = process.env.npm_lifecycle_event;
const isProduction = script === "build" || script === "start";

const nextConfig: NextConfig = {
  distDir: isProduction ? ".next-build" : ".next",
};

export default nextConfig;
