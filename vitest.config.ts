import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@spec": path.resolve(import.meta.dirname, "spec"),
      "@config": path.resolve(import.meta.dirname, "config"),
      // `server-only` throws outside a React Server environment; tests run in plain Node.
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/db/**"],
  },
});
