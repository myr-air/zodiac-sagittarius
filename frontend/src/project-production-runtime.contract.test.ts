import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  collectSourceFiles,
  frontendRoot,
  repoRoot,
} from "./project-contract.helpers";

describe("Sagittarius production runtime contracts", () => {
  it("documents the runtime internal API proxy used by production Docker", () => {
    const routeFile = join(frontendRoot, "app/api/v1/[...path]/route.ts");
    const routeHandler = readFileSync(routeFile, "utf8");

    expect(existsSync(routeFile)).toBe(true);
    expect(routeHandler).toContain("SAGITTARIUS_INTERNAL_API_BASE_URL");
    expect(routeHandler).toContain("/api/v1/");
    expect(routeHandler).toContain("GET");
    expect(routeHandler).toContain("POST");
    expect(routeHandler).toContain("PATCH");
    expect(routeHandler).toContain("DELETE");
    expect(routeHandler).toContain("OPTIONS");
    expect(routeHandler).toContain("HEAD");
  });

  it("keeps production source free of unimplemented runtime placeholders", () => {
    const sourceRoots = [
      join(frontendRoot, "app"),
      join(frontendRoot, "src"),
      join(repoRoot, "backend/crates/sagittarius-api/src"),
    ];
    const blocked = /\b(?:unimplemented!|todo!)\s*\(|not implemented|coming soon/i;
    const offenders = sourceRoots
      .flatMap((root) => collectSourceFiles(root))
      .filter((filePath) => filePath !== fileURLToPath(import.meta.url))
      .filter((filePath) => blocked.test(readFileSync(filePath, "utf8")))
      .map((filePath) => filePath.replace(`${repoRoot}/`, ""));

    expect(offenders).toEqual([]);
  });
});
