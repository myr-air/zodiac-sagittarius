import react from "@vitejs/plugin-react";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const selectedProjects = new Set(process.argv.flatMap((arg, index, args) => (arg === "--project" ? [args[index + 1]] : [])));
const shouldLoadStorybookProject = selectedProjects.size === 0 || selectedProjects.has("storybook");

const unitProject = {
  extends: true as const,
  test: {
    name: "unit",
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 15_000,
    exclude: ["**/*.stories.*", "**/node_modules/**", "**/.next/**", "**/storybook-static/**", "tests/**"],
  },
};

const storybookProject = {
  extends: true as const,
  plugins: [
    storybookTest({
      configDir: path.join(dirname, ".storybook"),
      storybookScript: "bun run storybook -- --ci",
    }),
  ],
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      provider: playwright({}),
      headless: true,
      instances: [{ browser: "chromium" as const }],
    },
    testTimeout: 30_000,
  },
};

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    projects: shouldLoadStorybookProject ? [unitProject, storybookProject] : [unitProject],
  },
});
