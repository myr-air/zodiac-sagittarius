import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(testDir, "..");

describe("Create trip UX QA harness", () => {
  it("exposes a repeatable browser QA command for portal and map fallback states", () => {
    const packageJson = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const scriptPath = join(frontendRoot, "scripts/run-create-trip-ux-qa.ts");

    expect(packageJson.scripts?.["test:create-trip-ux-qa"]).toBe("bun run scripts/run-create-trip-ux-qa.ts");
    expect(existsSync(scriptPath)).toBe(true);
    expect(readFileSync(scriptPath, "utf8")).toContain("portal-my-trips-empty-desktop.png");
    expect(readFileSync(scriptPath, "utf8")).toContain("map-fallback-desktop.png");
  });
});
