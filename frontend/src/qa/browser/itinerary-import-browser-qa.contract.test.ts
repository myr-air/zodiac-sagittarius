import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  frontendPath,
  readFrontendPackageJson,
  readFrontendText,
} from "../testing/frontend-root";

describe("Itinerary import browser QA harness", () => {
  it("exposes a repeatable desktop and mobile import QA command", () => {
    const packageJson = readFrontendPackageJson();
    const scriptPath = frontendPath("scripts/run-itinerary-import-browser-qa.ts");
    const script = readFrontendText("scripts/run-itinerary-import-browser-qa.ts");

    expect(packageJson.scripts?.["test:itinerary-import-browser-qa"]).toBe(
      "bun run scripts/run-itinerary-import-browser-qa.ts",
    );
    expect(existsSync(scriptPath)).toBe(true);
    expect(script).toContain("desktop-1280");
    expect(script).toContain("mobile-390");
    expect(script).toContain("Browser QA flight block");
    expect(script).toContain("Browser QA booking");
    expect(script).toContain("Browser QA task");
    expect(script).toContain("1 booking");
    expect(script).toContain("1 expense");
    expect(script).toContain("1 task");
    expect(script).toContain("1 note");
    expect(script).toContain("assertNoHorizontalPageOverflow");
    expect(script).toContain("console errors");
    expect(script).toContain("evidence.json");
  });
});
