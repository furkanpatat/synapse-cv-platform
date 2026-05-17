import { defineConfig } from "vitest/config";
import path from "node:path";

// Vitest config for unit tests of pure utility modules.
// happy-dom (lighter than jsdom) covers the small bits of browser-API
// usage in our utilities (e.g. window/document in transcript-cleanup).
export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "**/*.config.*",
        ".next/**",
        "node_modules/**",
        "src/types/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
