import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(testDir, "..");

describe("Trip Plan browser QA harness", () => {
  it("exposes a repeatable selector and set-main QA command", () => {
    const packageJson = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const scriptPath = join(frontendRoot, "scripts/run-trip-plan-browser-qa.ts");
    const script = readFileSync(scriptPath, "utf8");

    expect(packageJson.scripts?.["test:trip-plan-browser-qa"]).toBe(
      "bun run scripts/run-trip-plan-browser-qa.ts",
    );
    expect(existsSync(scriptPath)).toBe(true);
    expect(script).toContain("desktop-1280");
    expect(script).toContain("mobile-390");
    expect(script).toContain("Browser QA Rain Plan");
    expect(script).toContain("ใช้เป็นแผนหลัก");
    expect(script).toContain("creating and selecting a draft Trip Plan must not publish it");
    expect(script).toContain("explicit Set as main should publish the selected Trip Plan");
    expect(script).toContain("assertTripPlanOptionLabels");
    expect(script).toContain("assertNoHorizontalPageOverflow");
    expect(script).toContain("console errors");
    expect(script).toContain("evidence.json");
  });
});
