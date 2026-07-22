import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

/** Matches tsconfig paths: `"@/*": ["./*"]`. */
const resolveAlias = {
  "@": frontendRoot,
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: resolveAlias },
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        resolve: { alias: resolveAlias },
        test: {
          name: "dom",
          environment: "happy-dom",
          include: ["components/**/*.test.tsx"],
          setupFiles: ["./vitest.dom-setup.ts"],
        },
      },
    ],
  },
});
