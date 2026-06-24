import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot, repoRoot } from "../project-contract.helpers";
import {
  appStoryPaths,
  srcStoryPath,
} from "../../../storybook/contracts/storybook.contract.story-paths";
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

  it("splits Sagittarius story fixtures and assertions into focused storybook support modules", () => {
    const stories = readFileSync(
      join(
        frontendRoot,
        ...srcStoryPath(appStoryPaths.sagittariusApp).split("/"),
      ),
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
    const storyRouteStories = readFileSync(
      join(
        frontendRoot,
        "src/trip/workspace/sagittarius-app/support/storybook-route-stories.ts",
      ),
      "utf8",
    );
    const storyBuilders = readFileSync(
      join(
        frontendRoot,
        "src/trip/workspace/sagittarius-app/support/storybook-story-builders.ts",
      ),
      "utf8",
    );
    const storyViewportStories = readFileSync(
      join(
        frontendRoot,
        "src/trip/workspace/sagittarius-app/support/storybook-viewport-stories.ts",
      ),
      "utf8",
    );
    const sagittariusAppCore = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/SagittariusAppCore.tsx"),
      "utf8",
    );
    const workspaceItineraryImportHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-itinerary-import.ts"),
      "utf8",
    );
    expect(stories).not.toContain("@/src/routes/app-routes");
    expect(stories).not.toContain(
      "@/src/trip/workspace/sagittarius-app/support/route-patterns",
    );
    expect(stories).toContain(
      "@/src/trip/workspace/sagittarius-app/support/storybook-expectations",
    );
    expect(stories).toContain(
      "@/src/trip/workspace/sagittarius-app/support/storybook-fixtures",
    );
    expect(stories).toContain(
      "@/src/trip/workspace/sagittarius-app/support/storybook-route-stories",
    );
    expect(stories).toContain(
      "@/src/trip/workspace/sagittarius-app/support/storybook-story-builders",
    );
    expect(storyFixtures).toContain("@/src/trip/testing/fixtures/trip-story-fixtures");
    expect(storyFixtures).toContain("storyTripId");
    expect(storyFixtures).toContain("seedTripJoinId");
    expect(storyRouteStories).toContain("@/src/routes/app-routes");
    expect(storyRouteStories).toContain(
      "@/src/trip/workspace/sagittarius-app/support/route-patterns",
    );
    expect(storyRouteStories).toContain("export const tripOverviewAccessStory");
    expect(storyBuilders).toContain("export function appViewportStory");
    expect(stories).toContain(
      "@/src/trip/workspace/sagittarius-app/support/storybook-viewport-stories",
    );
    expect(storyViewportStories).toContain("export const appViewportStories");
    expect(storyViewportStories).toContain("expectDesktopOverviewWorkspace");
    expect(storyExpectations).toContain("export async function expectWorkspaceView");
    expect(sagittariusAppCore).toContain(
      "./hooks/use-sagittarius-workspace-contexts",
    );
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
