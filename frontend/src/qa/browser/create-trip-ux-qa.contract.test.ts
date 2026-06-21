import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  frontendPath,
  readFrontendPackageJson,
  readFrontendText,
} from "../testing/frontend-root";

describe("Create trip UX QA harness", () => {
  it("exposes a repeatable browser QA command for portal and map fallback states", () => {
    const packageJson = readFrontendPackageJson();
    const scriptPath = frontendPath("scripts/run-create-trip-ux-qa.ts");
    const script = readFrontendText("scripts/run-create-trip-ux-qa.ts");

    expect(packageJson.scripts?.["test:create-trip-ux-qa"]).toBe("bun run scripts/run-create-trip-ux-qa.ts");
    expect(existsSync(scriptPath)).toBe(true);
    expect(script).toContain("portal-my-trips-empty-desktop.png");
    expect(script).toContain("create-trip-builder-desktop.png");
    expect(script).toContain("create-trip-builder-dates-desktop.png");
    expect(script).toContain("create-trip-builder-invite-desktop.png");
    expect(script).toContain("create-trip-builder-mobile-preview.png");
    expect(script).toContain("map-fallback-desktop.png");
  });
});
