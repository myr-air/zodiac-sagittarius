import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  frontendPath,
  readFrontendPackageJson,
  readFrontendText,
} from "../testing/frontend-root";

describe("Trip Plan browser QA harness", () => {
  it("exposes a repeatable selector and set-main QA command", () => {
    const packageJson = readFrontendPackageJson();
    const scriptPath = frontendPath("scripts/run-trip-plan-browser-qa.ts");
    const script = readFrontendText("scripts/run-trip-plan-browser-qa.ts");

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
