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

  it("documents the future Rust/PostgreSQL API data contract", () => {
    const spec = readFileSync("docs/api-data-spec.md", "utf8");

    expect(spec).toContain("CREATE TABLE trips");
    expect(spec).toContain("CREATE TABLE itinerary_items");
    expect(spec).toContain("GET /v1/trips/:tripId");
    expect(spec).toContain("PATCH /v1/itinerary-items/:itemId");
    expect(spec).toContain("wss://api.sagittarius.local/v1/trips/:tripId/ws");
    expect(spec).toContain("itinerary_item.updated");
    expect(spec).toContain("clientMutationId");
  });
});
