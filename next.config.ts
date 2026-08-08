import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

/**
 * The project root, resolved from this file rather than from cwd.
 *
 * Server code that reads shipped files — the quarterly report PDFs in
 * public/media/reports — cannot use process.cwd(), because cwd is wherever
 * the process happened to be started. The dev server here is launched from
 * the parent folder with the project passed as an argument, so cwd points
 * at a directory with no public/ in it, and __dirname does not survive
 * Turbopack's bundling either.
 *
 * This file is the one thing Next always loads from the project root, so
 * its own location is the reliable anchor. Injected as an env var, it is
 * baked in at build time and correct regardless of how anything is started.
 */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  distDir: isProduction ? ".next-build" : ".next",
  env: { TAIZAN_PROJECT_ROOT: projectRoot },
};

export default nextConfig;
