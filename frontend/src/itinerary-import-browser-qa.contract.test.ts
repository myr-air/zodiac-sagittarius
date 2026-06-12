import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(testDir, "..");

describe("Itinerary import browser QA harness", () => {
  it("exposes a repeatable desktop and mobile import QA command", () => {
    const packageJson = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const scriptPath = join(frontendRoot, "scripts/run-itinerary-import-browser-qa.ts");
    const script = readFileSync(scriptPath, "utf8");

    expect(packageJson.scripts?.["test:itinerary-import-browser-qa"]).toBe(
      "bun run scripts/run-itinerary-import-browser-qa.ts",
    );
    expect(existsSync(scriptPath)).toBe(true);
    expect(script).toContain("desktop-1280");
    expect(script).toContain("mobile-390");
    expect(script).toContain("Browser QA flight block");
    expect(script).toContain("Browser QA task");
    expect(script).toContain("assertNoHorizontalPageOverflow");
    expect(script).toContain("console errors");
    expect(script).toContain("evidence.json");
  });
});
