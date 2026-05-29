import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("frontend core freeze contract", () => {
  const freezeDoc = readFileSync("docs/frontend-core-freeze.md", "utf8");
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts?: Record<string, string> };
  const storybookPreview = readFileSync(".storybook/preview.ts", "utf8");
  const mswHandlers = readFileSync(".storybook/msw-handlers.ts", "utf8");

  it("documents the frontend as frozen for backend integration", () => {
    expect(freezeDoc).toContain("Status: frozen for backend integration.");
    expect(freezeDoc).toContain("## Frozen Surface");
    expect(freezeDoc).toContain("## Allowed Changes During Backend Integration");
    expect(freezeDoc).toContain("## Deferred Until After Backend Slice");
    expect(freezeDoc).toContain("docs/api-data-spec.md");
  });

  it("keeps one frontend verification command for freeze gates", () => {
    expect(packageJson.scripts?.["test:storybook"]).toBe("vitest --project storybook run");
    expect(packageJson.scripts?.["verify:frontend"]).toBe(
      "bun run lint && bun run typecheck && bun run test && bun run test:storybook && bun run build && bun run build-storybook",
    );
    expect(freezeDoc).toContain("rtk bun run verify:frontend");
  });

  it("keeps Storybook wired as the stable template source", () => {
    expect(storybookPreview).toContain('import "maplibre-gl/dist/maplibre-gl.css"');
    expect(storybookPreview).toContain('import "../app/globals.css"');
    expect(storybookPreview).toContain('initialize({ onUnhandledRequest: "bypass" })');
    expect(storybookPreview).toContain("mswLoader");
    expect(mswHandlers).toContain("export const mswHandlers");
  });

  it("requires backend-driven changes instead of new frontend-only scope", () => {
    expect(freezeDoc).toContain("New top-level frontend pages or major page re-layouts.");
    expect(freezeDoc).toContain("New client-only planning features that are not driven by a backend contract.");
    expect(freezeDoc).toContain("Prefer vertical slices over more frontend-only polish");
  });
});
