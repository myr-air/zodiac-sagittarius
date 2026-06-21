import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot, repoRoot } from "../project-contract.helpers";
import {
  frontendScaffoldPathsAbsent,
  frontendScaffoldPathsPresent,
  repoScaffoldPathsAbsent,
  repoScaffoldPathsPresent,
} from "./project-contract.scaffold-paths";

describe("Sagittarius project scaffold", () => {
  it("keeps scaffold path catalogs unique", () => {
    [
      frontendScaffoldPathsPresent,
      frontendScaffoldPathsAbsent,
      repoScaffoldPathsPresent,
      repoScaffoldPathsAbsent,
    ].forEach((paths) => expect(new Set(paths).size).toBe(paths.length));
  });

  it("separates frontend and backend services behind a root Makefile", () => {
    frontendScaffoldPathsPresent.forEach((path) => expect(existsSync(join(frontendRoot, path))).toBe(true));
    frontendScaffoldPathsAbsent.forEach((path) => expect(existsSync(join(frontendRoot, path))).toBe(false));
    repoScaffoldPathsPresent.forEach((path) => expect(existsSync(join(repoRoot, path))).toBe(true));
    repoScaffoldPathsAbsent.forEach((path) => expect(existsSync(join(repoRoot, path))).toBe(false));

    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");

    [
      "frontend-dev:",
      "frontend-build:",
      "frontend-test:",
      "frontend-storybook:",
      "frontend-verify:",
      "backend-test:",
      "verify:",
    ].forEach((target) => expect(makefile).toContain(target));
  });

  it("uses Bun scripts and Storybook for frontend development", () => {
    const packageJson = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8")) as {
      packageManager?: string;
      scripts?: Record<string, string>;
    };

    expect(packageJson.packageManager).toMatch(/^bun@/);
    expect(packageJson.scripts?.storybook).toContain("storybook dev");
    expect(packageJson.scripts?.["build-storybook"]).toContain("storybook build");
    expect(readFileSync(join(frontendRoot, ".storybook/main.ts"), "utf8")).toContain("@storybook/nextjs-vite");
  });

  it("splits Sagittarius story fixtures and asserts via shared storybook support", () => {
    const stories = readFileSync(
      join(frontendRoot, "src/app/storybook/SagittariusApp.stories.tsx"),
      "utf8",
    );
    const storySupport = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/support/storybook-support.ts"),
      "utf8",
    );
    const storyExpectations = readFileSync(
      join(
        frontendRoot,
        "src/trip/workspace/sagittarius-app/support/storybook-expectations.ts",
      ),
      "utf8",
    );
    const storyFixtures = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/support/storybook-fixtures.ts"),
      "utf8",
    );
    const storyBuilders = readFileSync(
      join(
        frontendRoot,
        "src/trip/workspace/sagittarius-app/support/storybook-story-builders.ts",
      ),
      "utf8",
    );
    const hooksIndex = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/index.ts"),
      "utf8",
    );
    const workspaceItineraryImportHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-itinerary-import.ts"),
      "utf8",
    );
    const supportIndex = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/support/index.ts"),
      "utf8",
    );
    const sagittariusIndex = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/index.ts"),
      "utf8",
    );

    expect(stories).toContain("@/src/trip/workspace/sagittarius-app/support");
    expect(stories).toContain(
      "@/src/trip/workspace/sagittarius-app/support/storybook-support",
    );
    expect(supportIndex).toContain('export * from "@/src/routes/app-routes"');
    expect(supportIndex).toContain('export { portalRoutes, tripRoutes } from "./route-patterns"');
    expect(supportIndex).toContain("route-matchers");
    expect(supportIndex).toContain("portalRoutes");
    expect(storySupport).toContain('export * from "./storybook-expectations"');
    expect(storySupport).toContain('export * from "./storybook-fixtures"');
    expect(storySupport).toContain('export * from "./storybook-story-builders"');
    expect(storyFixtures).toContain("export const storyTripId");
    expect(storyFixtures).toContain("seedTripJoinId");
    expect(storyBuilders).toContain("export function appViewportStory");
    expect(storyExpectations).toContain("export async function expectWorkspaceView");
    expect(hooksIndex).toContain("useWorkspaceItineraryImport");
    expect(hooksIndex).toContain("useWorkspaceAdministration");
    expect(hooksIndex).toContain("useWorkspaceCommands");
    expect(hooksIndex).toContain("useWorkspaceSession");
    expect(hooksIndex).toContain("useWorkspaceAccessGate");
    expect(hooksIndex).toContain("useWorkspaceUiState");
    expect(hooksIndex).toContain("useWorkspaceCockpitReplacement");
    expect(hooksIndex).not.toContain("useWorkspaceRecordActions");
    expect(hooksIndex).not.toContain("useWorkspaceRecordState");
    expect(sagittariusIndex).toContain("SagittariusApp");
    expect(sagittariusIndex).toContain("SagittariusAppCore");
    expect(sagittariusIndex).not.toContain("public-exports");
    expect(sagittariusIndex).not.toContain("bookingTypeForItineraryItem");
    expect(sagittariusIndex).not.toContain("nextLocalTaskId");
    expect(sagittariusIndex).not.toContain("normalizeInlineTimePatch");
    expect(workspaceItineraryImportHook).toContain(
      "export function useWorkspaceItineraryImport",
    );
  });

  it("keeps project-side routing docs current", () => {
    const map = readFileSync(join(repoRoot, "docs/MAP.md"), "utf8");
    const commands = readFileSync(join(repoRoot, "docs/COMMANDS.md"), "utf8");

    expect(map).toContain("[AGENTS.md](../AGENTS.md)");
    expect(map).toContain("[CONTEXT.md](../CONTEXT.md)");
    expect(map).toContain("[docs/COMMANDS.md](./COMMANDS.md)");
    expect(map).toContain("[frontend/src/trip/](../frontend/src/trip)");
    expect(map).toContain("[frontend/src/features/](../frontend/src/features)");
    expect(map).toContain("[frontend/src/shared/components/](../frontend/src/shared/components)");
    expect(map).toContain("[frontend/src/ui/](../frontend/src/ui)");
    expect(map).toContain("[backend/crates/sagittarius-api/src/api/](../backend/crates/sagittarius-api/src/api)");
    expect(map).toContain("[backend/migrations/](../backend/migrations)");
    expect(map).toContain("[docs/itinerary-trip-plan-phase-0-1-implementation-spec.md](./itinerary-trip-plan-phase-0-1-implementation-spec.md)");

    expect(commands).toContain("Use `rtk` for shell commands");
    expect(commands).toContain("| Backend schema/contracts | `backend/` | `rtk cargo test -p sagittarius-api --test schema_contract -- --nocapture` |");
    expect(commands).toContain("| Frontend type safety | `frontend/` | `rtk bun run typecheck` |");
    expect(commands).toContain("| Real API e2e compatibility | Repository root | `rtk make frontend-e2e-local` |");
    expect(commands).toContain("| Aries profile gate before strong claims | `/Users/xiivth/.codex/aries` | `rtk python3 scripts/check_all.py` |");
  });

});
