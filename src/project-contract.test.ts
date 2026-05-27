import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Sagittarius project scaffold", () => {
  it("uses Bun scripts and Storybook for frontend development", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      packageManager?: string;
      scripts?: Record<string, string>;
    };

    expect(packageJson.packageManager).toMatch(/^bun@/);
    expect(packageJson.scripts?.storybook).toContain("storybook dev");
    expect(packageJson.scripts?.["build-storybook"]).toContain("storybook build");
    expect(readFileSync(".storybook/main.ts", "utf8")).toContain("@storybook/nextjs-vite");
  });

  it("uses Next App Router and the production app entry", () => {
    expect(readFileSync("app/page.tsx", "utf8")).toContain("<SagittariusApp />");
    expect(readFileSync("app/layout.tsx", "utf8")).toContain("Sagittarius");
  });

  it("keeps the Calm Travel Ops design tokens in globals", () => {
    const css = readFileSync("app/globals.css", "utf8");

    expect(css).toContain("--color-primary: #0f766e");
    expect(css).toContain("--color-route: #2563eb");
    expect(css).toContain("--color-warning: #f97316");
  });
});
