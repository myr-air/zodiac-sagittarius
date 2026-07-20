import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "components/**/*.test.tsx"],
    environmentMatchGlobs: [
      ["components/**/*.test.tsx", "happy-dom"],
    ],
  },
});
