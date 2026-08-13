import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Unit tests only — financial logic, provider normalisation and the
 * data-quality invariants. Nothing here touches the network: the
 * provider payloads under __fixtures__ are real responses captured from
 * the live API, so the tests stay deterministic while still asserting
 * against the exact shapes the provider actually sends.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
