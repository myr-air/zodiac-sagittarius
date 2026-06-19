import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(testDir, "..");
const repoRoot = resolve(frontendRoot, "..");
const productCopySourceRoots = [
  "app",
  "src/app",
  "src/components",
  "src/shared/components",
  "src/i18n",
];

function collectProductCopyFiles(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (["node_modules", ".next", "storybook-static"].includes(entry)) continue;
      files.push(...collectProductCopyFiles(path));
      continue;
    }
    if (!/\.[cm]?[jt]sx?$/.test(entry)) continue;
    if (/\.(test|spec|stories)\.[cm]?[jt]sx?$/.test(entry)) continue;
    if (entry === "types.ts" || entry === "api-client.ts") continue;
    files.push(path);
  }
  return files;
}

describe("Sagittarius project scaffold", () => {
  it("separates frontend and backend services behind a root Makefile", () => {
    expect(existsSync(join(frontendRoot, "package.json"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/app/SagittariusApp.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/account/AccountApp.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/lib/file-names.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/ui/workspace-primitives.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceApp.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceDeleteDialog.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceFrame.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceImportDialog.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceRail.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceViews.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/SagittariusApp.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/index.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/public-exports.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/access-gate.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/types.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/SagittariusAppCore.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/WorkspaceMainShell.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/sagittarius-app.styles.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/WorkspaceRolePreview.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/index.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/support/index.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/support/storybook-support.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-photo-albums.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-administration.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/records/use-workspace-record-state.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/records/use-workspace-record-actions.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-records.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-access-gate.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-itinerary-commands.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-itinerary-import.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-booking-commands.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-session.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/sagittarius-app/use-workspace-record-state.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/app/SagittariusApp.stories.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/TripAccessLoadingFrame.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/WorkspaceToast.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/itinerary-import-model.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/itinerary-import-api.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/planning-view.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/selected-trip-plan.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/workspace/trip-plan-records.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/local-ids.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/join-return.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/api-errors.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/participant-session-storage.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/trip-plans.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/trip-settings.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/trip-countries.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/stop-notes.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/tasks.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/itinerary-time.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/itinerary-api-requests.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/itinerary-paths-api.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/trip/place-resolution.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/routes/invite-links.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-trip-destinations.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-trip-dates.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-trip-credentials.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/index.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/account-trip-destinations.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/account-trip-dates.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/account-trip-credentials.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-access-error-codes.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-passkey-support.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-auth-support.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-auth-chrome.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-access-panel-chrome.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/auth/index.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/auth/account-access-error-codes.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/auth/account-passkey-support.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/auth/account-auth-support.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/auth/account-auth-chrome.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-access-panel-test-utils.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-access-panel-test-clients.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/testing/account-access-panel-test-utils.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/testing/account-access-panel-test-clients.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-email-login-credentials-step.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-email-login-panel.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-email-login-step-content.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-email-login-styles.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/use-email-login-panel-state.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/email-login/index.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/email-login/account-email-login-credentials-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/email-login/account-email-login-methods-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/email-login/account-email-login-otp-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/email-login/account-email-login-password-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/email-login/account-email-login-setup-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-portal-dashboard.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-portal-primitives.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/use-account-portal-data.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/portal/index.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/portal/account-portal-dashboard.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/portal/account-portal-primitives.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/portal/use-account-portal-data.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/portal-trip-wizard-dates-step.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/portal-trip-wizard.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard-actions.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard-dates-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard-destination-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard-invite-review.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/trip-join-gate/trip-join-gate.support.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/trip-join-gate/trip-join-gate.styles.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinGateChrome.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinRoomForm.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinGateVisual.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/shared/components/date-time-pickers/DatePickerField.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/shared/components/date-time-pickers/DateTimePickerField.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/shared/components/date-time-pickers/TimePickerField.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/shared/components/date-time-pickers/DateTimePickerContent.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/shared/components/date-time-pickers/date-time-picker.styles.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/shared/components/date-time-pickers/date-time-picker.types.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/workspace/pages/trip-settings/TripSettingsPage.types.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/OverviewPage.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/overview/OverviewPage.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/overview/OverviewCockpit.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/overview/OverviewTaskDialog.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/overview/OverviewWeatherBriefing.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/ContextRail.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/context-rail/ContextRail.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/context-rail/index.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/SmartItineraryTable.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/SmartItineraryTable.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/index.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table.styles.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table.styles.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table-utils.ts"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-utils.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/ActivityPathGraphDay.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/activity-path-graph/ActivityPathGraphDay.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/activity-path-graph/index.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/StopDialog.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/stop-dialog/StopDialog.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/stop-dialog/index.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/RouteMapView.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/route-map/RouteMapView.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/route-map/RouteMapUnresolvedPanel.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/route-map/use-route-live-map.ts"))).toBe(true);
    expect(existsSync(join(repoRoot, "backend/Cargo.toml"))).toBe(true);
    expect(existsSync(join(repoRoot, "package.json"))).toBe(false);

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
      join(frontendRoot, "src/app/SagittariusApp.stories.tsx"),
      "utf8",
    );
    const storySupport = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/support/storybook-support.ts"),
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
    expect(storySupport).toContain("export const storyTripId");
    expect(storySupport).toContain("export function appViewportStory");
    expect(storySupport).toContain("export async function expectWorkspaceView");
    expect(storySupport).toContain("seedTripJoinId");
    expect(hooksIndex).toContain("useWorkspaceItineraryImport");
    expect(hooksIndex).toContain("useWorkspaceAdministration");
    expect(hooksIndex).toContain("useWorkspaceSession");
    expect(hooksIndex).toContain("useWorkspaceAccessGate");
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

  it("keeps shared UI primitives split by responsibility", () => {
    const uiIndex = readFileSync(join(frontendRoot, "src/ui/index.ts"), "utf8");
    const primitives = readFileSync(join(frontendRoot, "src/ui/primitives.tsx"), "utf8");
    const workspacePrimitives = readFileSync(join(frontendRoot, "src/ui/workspace-primitives.tsx"), "utf8");

    expect(uiIndex).toContain("./primitives");
    expect(uiIndex).toContain("./workspace-primitives");
    expect(primitives).toContain("export function Button");
    expect(primitives).toContain("export function Badge");
    expect(primitives).not.toContain("export function WorkspaceSurface");
    expect(primitives).not.toContain("fieldControlClassName");
    expect(workspacePrimitives).toContain("export function WorkspaceSurface");
    expect(workspacePrimitives).toContain("export function WorkspacePage");
    expect(workspacePrimitives).toContain("export const fieldControlClassName");
  });

  it("uses Next App Router with trip-scoped production routes", () => {
    expect(readFileSync(join(frontendRoot, "app/page.tsx"), "utf8")).toContain("HomeLanding");
    const homeLanding = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLanding.tsx"), "utf8");
    const homeLandingMeta = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLanding.meta.ts"), "utf8");
    const homeLandingStyles = readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLanding.styles.ts"), "utf8");
    expect(homeLanding).toContain("LanguageSwitch");
    expect(homeLanding).toContain("./HomeLanding.meta");
    expect(homeLanding).toContain("./HomeLanding.styles");
    expect(homeLanding).not.toContain("const homePageClassName");
    expect(homeLanding).not.toContain("const workflowStepMeta");
    expect(homeLandingMeta).toContain("workflowStepMeta");
    expect(homeLandingMeta).toContain("previewDayKeys");
    expect(homeLandingStyles).toContain("homePageClassName");
    expect(homeLandingStyles).toContain("workflowToneClassNames");
    expect(readFileSync(join(frontendRoot, "src/i18n/messages.ts"), "utf8")).toContain("Plan trips with friends");
    expect(readFileSync(join(frontendRoot, "src/i18n/messages.ts"), "utf8")).toContain("วางแผนทริปกับเพื่อน");
    expect(existsSync(join(frontendRoot, "app/access/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/login/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/register/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/portal/page.tsx"))).toBe(true);
    [
      "app/portal/my-trips/page.tsx",
      "app/portal/explorer/page.tsx",
      "app/portal/to-dos/page.tsx",
      "app/portal/vault/page.tsx",
      "app/portal/settings/page.tsx",
      "app/portal/sign-out/page.tsx",
    ].forEach((routeFile) => expect(existsSync(join(frontendRoot, routeFile))).toBe(true));
    expect(readFileSync(join(frontendRoot, "app/access/page.tsx"), "utf8")).toContain("appRoutes.portal()");
    expect(readFileSync(join(frontendRoot, "app/login/page.tsx"), "utf8")).toContain("redirect(appRoutes.login())");
    expect(readFileSync(join(frontendRoot, "app/register/page.tsx"), "utf8")).toContain("redirect(appRoutes.register())");
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/itinerary/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/map/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/timeline/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/trips/[tripId]/members/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/join/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/join/[joinCode]/page.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "app/join/demo/page.tsx"))).toBe(false);
    expect(readFileSync(join(frontendRoot, "app/join/[joinCode]/page.tsx"), "utf8")).toContain("initialJoinCode={decodedJoinCode}");
    expect(readFileSync(join(frontendRoot, "app/layout.tsx"), "utf8")).toContain("Joii");
  });

  it("keeps the Calm Travel Ops design tokens in globals", () => {
    const css = readFileSync(join(frontendRoot, "app/globals.css"), "utf8");

    expect(css).toContain("--color-primary: #c24f16");
    expect(css).toContain("--color-route: #2563eb");
    expect(css).toContain("--color-warning: #b45309");
  });

  it("uses Trip Plan language in product copy instead of rollout compatibility names", () => {
    const messages = readFileSync(join(frontendRoot, "src/i18n/messages.ts"), "utf8");

    expect(messages).toContain("Trip Plan");
    expect(messages).not.toMatch(/\bTrip Sheet\b/i);
    expect(messages).not.toMatch(/\bPlan Variant\b/i);
  });

  it("keeps production frontend copy on Trip Plan terminology", () => {
    const productCopy = productCopySourceRoots
      .flatMap((root) => collectProductCopyFiles(join(frontendRoot, root)))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(productCopy).toContain("Trip Plan");
    expect(productCopy).not.toMatch(/\bTrip Sheet\b/i);
    expect(productCopy).not.toMatch(/\bPlan Variant\b/i);
    expect(productCopy).not.toMatch(/\bplan variant\b/);
    expect(productCopy).not.toMatch(/\btrip sheet\b/i);
  });

  it("documents the Rust/PostgreSQL API data contract", () => {
    const spec = readFileSync(join(repoRoot, "docs/api-data-spec.md"), "utf8");

    expect(spec).toContain("CREATE TABLE trips");
    expect(spec).toContain("CREATE TABLE itinerary_items");
    expect(spec).toContain("GET /api/v1/trips/:tripId");
    expect(spec).toContain("POST /api/v1/trip-join-sessions");
    expect(spec).toContain("CREATE TABLE trip_member_sessions");
    expect(spec).toContain("CREATE TABLE trip_join_sessions");
    expect(spec).toContain("PATCH /api/v1/trips/:tripId/itinerary-items/:itemId");
    expect(spec).toContain("wss://api.sagittarius.local/api/v1/trips/:tripId/events/stream");
    expect(spec).toContain("itinerary_item.updated");
    expect(spec).toContain("clientMutationId");
  });

  it("documents the backend vertical slice verification command", () => {
    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");

    expect(makefile).toContain("TEST_DATABASE_URL ?= postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test");
    expect(makefile).toContain('DATABASE_URL="$(TEST_DATABASE_URL)" cargo test --manifest-path $(BACKEND_MANIFEST)');
    expect(makefile).toContain("backend-daily-briefings-contract: db-init-test");
    expect(makefile).toContain('DATABASE_URL="$(TEST_DATABASE_URL)" cargo test --manifest-path $(BACKEND_MANIFEST) -p sagittarius-api --test daily_briefings_contract');
  });

  it("keeps incremental database migrations independent in db-init targets", () => {
    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");

    expect(makefile).toContain("backend/migrations/0004_account_password_auth.sql");
    expect(makefile).toContain("backend/migrations/0005_account_portal.sql");
    expect(makefile).toContain("backend/migrations/0006_trip_countries.sql");
    expect(makefile).toContain("backend/migrations/0010_itinerary_activity_paths.sql");
    expect(makefile).toContain("backend/migrations/0011_expense_reminders.sql");
    expect(makefile).toContain("backend/migrations/0025_trip_plan_compatibility.sql");
    expect(makefile).toContain("backend/migrations/0026_plan_scoped_records.sql");
    expect(makefile).toContain("backend/migrations/0027_itinerary_hierarchy_time_windows.sql");
    expect(makefile).toContain("backend/migrations/0028_plan_check_trip_plan_scope.sql");
    expect(makefile).toContain("backend/migrations/0029_expense_reminder_trip_plan_scope.sql");
    expect(makefile).toContain("backend/migrations/0031_itinerary_activity_type_default.sql");
    expect(makefile).toContain("table_name='account_vault_items'");
    expect(makefile).toContain("table_name='trips' AND column_name='countries'");
    expect(makefile).toContain("table_name='itinerary_items' AND column_name='path_id'");
    expect(makefile).toContain("table_name='expense_reminders'");
    expect(makefile).toContain("table_name='trip_tasks' AND column_name='trip_plan_id'");
    expect(makefile).toContain("table_name='plan_checks' AND column_name='trip_plan_id'");
    expect(makefile).toContain("table_name='expense_reminders' AND column_name='trip_plan_id'");
    expect(makefile).toContain("pg_get_constraintdef(oid) LIKE '%default%'");
    expect(makefile).not.toMatch(/elif ! \$\(PSQL\)[\s\S]*account_vault_items/);
  });

  it("keeps the real API e2e runnable from a seeded local backend", () => {
    const packageJson = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");

    expect(packageJson.scripts?.["test:e2e:local"]).toBe("bun run scripts/run-local-real-api-e2e.ts");
    expect(packageJson.scripts?.["test:e2e:auth-browser"]).toBe("bun run scripts/run-local-real-browser-auth-e2e.ts");
    expect(packageJson.scripts?.["test:api-trace-smoke"]).toBe("bun run scripts/run-local-api-trace-smoke.ts");
    expect(packageJson.scripts?.["test:perf-smoke"]).toBe("bun run scripts/run-local-perf-smoke.ts");
    expect(packageJson.scripts?.["test:production-env"]).toBe("bun run scripts/check-production-env.ts");
    expect(packageJson.scripts?.["test:release-signoff"]).toBe("bun run scripts/check-release-signoff.ts");
    expect(packageJson.scripts?.["test:staging-preflight"]).toBe("bun run scripts/check-staging-preflight.ts");
    expect(packageJson.scripts?.["test:staging-signoff"]).toBe("bun run scripts/check-staging-signoff.ts");
    expect(existsSync(join(frontendRoot, "scripts/run-local-real-api-e2e.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/run-local-real-browser-auth-e2e.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/run-local-api-trace-smoke.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/run-local-perf-smoke.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/check-production-env.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/check-release-signoff.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/check-staging-preflight.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "scripts/check-staging-signoff.ts"))).toBe(true);
    const authBrowserE2e = readFileSync(join(frontendRoot, "scripts/run-local-real-browser-auth-e2e.ts"), "utf8");
    expect(authBrowserE2e).toContain('run("bun", ["run", "build"]');
    expect(authBrowserE2e).toContain('spawnLogged("frontend", "bun", ["run", "start"]');
    expect(authBrowserE2e).toContain('EMAIL_DELIVERY: "log"');
    expect(authBrowserE2e).toContain("Set password and continue");
    expect(authBrowserE2e).toContain("Verify email");
    expect(authBrowserE2e).not.toContain('name: /^Continue$/');
    expect(authBrowserE2e).not.toContain('name: /^Use password$/');
    expect(authBrowserE2e).not.toContain('name: /^Create my trip space$/');
    expect(authBrowserE2e).not.toContain('["run", "next", "dev"');
    const releaseSignoff = readFileSync(join(frontendRoot, "scripts/check-release-signoff.ts"), "utf8");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_API_BASE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_FRONTEND_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_BROWSER_PASSED");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED");
    expect(releaseSignoff).toContain("SAGITTARIUS_SIGNOFF_NO_P1_P2");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_API_BASE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_FRONTEND_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_BROWSER_SIGNOFF");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_PREFLIGHT_PASSED");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_ROLLBACK_VERIFIED");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED");
    expect(releaseSignoff).toContain("SAGITTARIUS_STAGING_NO_P1_P2");
    expect(releaseSignoff).toContain("must not point at localhost");
    expect(releaseSignoff).toContain("must not use placeholder domain");
    expect(releaseSignoff).toContain("must be a real owner, not TBD");
    const seedE2e = readFileSync(join(repoRoot, "backend/crates/sagittarius-api/src/bin/seed_e2e.rs"), "utf8");
    expect(seedE2e).toContain('const RESET_CONFIRMATION_ENV: &str = "SAGITTARIUS_ALLOW_E2E_DB_RESET"');
    expect(seedE2e).toContain('const TEST_DATABASE_NAME: &str = "sagittarius_test"');
    expect(seedE2e).toContain("database_name_from_url");
    expect(seedE2e).toContain("0005_account_portal.sql");
    expect(seedE2e).toContain("0006_trip_countries.sql");
    expect(seedE2e).toContain("0010_itinerary_activity_paths.sql");
    expect(seedE2e).toContain("0011_expense_reminders.sql");
    expect(seedE2e).toContain("0012_expense_exchange_rates.sql");
    expect(seedE2e).toContain("0013_expense_receipts_itemization.sql");
    expect(seedE2e).toContain("0014_expense_notes.sql");
    expect(seedE2e).toContain("0015_expense_comments.sql");
    expect(seedE2e).toContain("0025_trip_plan_compatibility.sql");
    expect(seedE2e).toContain("0026_plan_scoped_records.sql");
    expect(seedE2e).toContain("0027_itinerary_hierarchy_time_windows.sql");
    expect(seedE2e).toContain("0028_plan_check_trip_plan_scope.sql");
    expect(seedE2e).toContain("0029_expense_reminder_trip_plan_scope.sql");
    expect(seedE2e).toContain("0031_itinerary_activity_type_default.sql");
    for (const script of [
      "scripts/run-local-real-api-e2e.ts",
      "scripts/run-local-real-browser-auth-e2e.ts",
      "scripts/run-local-api-trace-smoke.ts",
      "scripts/run-local-perf-smoke.ts",
      "scripts/run-local-production-browser-qa.ts",
    ]) {
      expect(readFileSync(join(frontendRoot, script), "utf8")).toContain('SAGITTARIUS_ALLOW_E2E_DB_RESET: "1"');
    }
    expect(makefile).toContain("frontend-e2e-local:");
    expect(makefile).toContain("frontend-e2e-local: db-init-test");
    expect(makefile).toContain("bun run test:e2e:local");
    expect(makefile).toContain("frontend-e2e-auth-browser: db-init-test");
    expect(makefile).toContain("bun run test:e2e:auth-browser");
  });

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

  it("splits runtime env examples from release signoff evidence", () => {
    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");
    const dockerCompose = readFileSync(join(repoRoot, "docker-compose.yml"), "utf8");
    const frontendDockerfile = readFileSync(join(repoRoot, "frontend/Dockerfile"), "utf8");
    const localEnvExample = readFileSync(join(repoRoot, ".env.local.example"), "utf8");
    const productionEnvExample = readFileSync(join(repoRoot, ".env.production.example"), "utf8");
    const releaseSignoffEnvExample = readFileSync(join(repoRoot, ".env.release-signoff.example"), "utf8");
    const gitignore = readFileSync(join(repoRoot, ".gitignore"), "utf8");
    const apiServiceBlock = composeServiceBlock(dockerCompose, "sagittarius-server");
    const webServiceBlock = composeServiceBlock(dockerCompose, "sagittarius-web");
    const databaseHost = new URL(envFileValue(productionEnvExample, "DATABASE_URL")).hostname;
    const internalApiHost = new URL(
      envFileValue(productionEnvExample, "SAGITTARIUS_INTERNAL_API_BASE_URL"),
    ).hostname;

    expect(makefile).toContain("PRODUCTION_COMPOSE_FILE ?= docker-compose.yml");
    expect(makefile).not.toContain("docker-compose.production.yml");
    expect(makefile).toContain("SIGNOFF_ENV_FILE ?= .env.release-signoff");
    expect(makefile).toContain(
      'SIGNOFF_ENV_SOURCE := $(if $(filter /%,$(SIGNOFF_ENV_FILE)),$(SIGNOFF_ENV_FILE),./$(SIGNOFF_ENV_FILE))',
    );
    expect(makefile).toContain("release-signoff-check:");
    expect(makefile).toContain("staging-signoff-check: release-signoff-check");
    expect(makefile).toContain("production-deploy-gate: production-env-file-check release-signoff-check");
    expect(makefile).toContain(
      'set -a; . "$(SIGNOFF_ENV_SOURCE)"; set +a; cd $(FRONTEND_DIR) && bun run test:release-signoff',
    );

    for (const localDefault of [
      "DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius",
      "TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test",
      "PGADMIN_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres",
      "SAGITTARIUS_BIND_ADDR=127.0.0.1:5181",
      "SAGITTARIUS_ENV=development",
      "SAGITTARIUS_SEED_SAMPLE_DATA=1",
      "NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL=http://127.0.0.1:5181",
      "RUST_LOG=info,tower_http=info,sagittarius_api=info",
    ]) {
      expect(localEnvExample).toContain(localDefault);
    }

    for (const runtimeName of [
      "DATABASE_URL",
      "SAGITTARIUS_ENV",
      "SAGITTARIUS_SEED_SAMPLE_DATA",
      "SAGITTARIUS_ALLOWED_ORIGINS",
      "PASSKEY_ALLOWED_ORIGINS",
      "NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL",
      "SAGITTARIUS_INTERNAL_API_BASE_URL",
      "EMAIL_DELIVERY",
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USERNAME",
      "SMTP_PASSWORD",
      "EMAIL_FROM",
      "SENDMAIL_COMMAND",
      "RUST_LOG",
    ]) {
      expect(productionEnvExample).toContain(`${runtimeName}=`);
    }

    for (const signoffName of [
      "SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED",
      "SAGITTARIUS_SIGNOFF_API_BASE_URL",
      "SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_BROWSER_PASSED",
      "SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED",
      "SAGITTARIUS_SIGNOFF_ENVIRONMENT",
      "SAGITTARIUS_SIGNOFF_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_FRONTEND_URL",
      "SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_NO_P1_P2",
      "SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED",
      "SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED",
      "SAGITTARIUS_ALERT_RUNBOOK_URL",
      "SAGITTARIUS_ALERT_SINK_NAME",
      "SAGITTARIUS_FEATURE_OWNER",
      "SAGITTARIUS_ROLLBACK_OWNER",
    ]) {
      expect(releaseSignoffEnvExample).toContain(`${signoffName}=`);
    }

    expect(releaseSignoffEnvExample).not.toContain("SAGITTARIUS_STAGING_");
    expect(apiServiceBlock).toContain("context: .");
    expect(apiServiceBlock).toContain("dockerfile: backend/Dockerfile");
    expect(webServiceBlock).toContain("context: .");
    expect(webServiceBlock).toContain("dockerfile: frontend/Dockerfile");
    expect(frontendDockerfile).toContain("COPY --chown=bun:bun --from=builder /app/frontend/.next ./.next");
    expect(internalApiHost).toBe("sagittarius-api");
    expect(apiServiceBlock).toMatch(/aliases:\n\s+- sagittarius-api/);
    expect(databaseHost).toBe("zodiac-postgres");
    expect(dockerCompose).toMatch(/ophiuchus:\n\s+external: true\n\s+name: ophiuchus-network/);
    expect(apiServiceBlock).toContain("ophiuchus:");
    expect(gitignore).toContain(".env");
    expect(gitignore).toContain(".env.local");
    expect(gitignore).toContain(".env.production");
    expect(gitignore).toContain(".env.release-signoff");
  });

  it("keeps production-readiness gates repeatable from the root Makefile", () => {
    const makefile = readFileSync(join(repoRoot, "Makefile"), "utf8");
    const packageJson = JSON.parse(readFileSync(join(frontendRoot, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const apiMod = readFileSync(join(repoRoot, "backend/crates/sagittarius-api/src/api/mod.rs"), "utf8");
    const apiMain = readFileSync(join(repoRoot, "backend/crates/sagittarius-api/src/main.rs"), "utf8");
    const productionEnvCheck = readFileSync(join(frontendRoot, "scripts/check-production-env.ts"), "utf8");
    const productionEnvExample = readFileSync(join(repoRoot, ".env.production.example"), "utf8");
    const authBrowserE2e = readFileSync(join(frontendRoot, "scripts/run-local-real-browser-auth-e2e.ts"), "utf8");
    const workflow = readFileSync(join(repoRoot, ".github/workflows/production-readiness.yml"), "utf8");

    expect(existsSync(join(repoRoot, ".dockerignore"))).toBe(true);
    expect(existsSync(join(repoRoot, "backend/Dockerfile"))).toBe(true);
    expect(existsSync(join(repoRoot, "frontend/Dockerfile"))).toBe(true);
    expect(makefile).toContain("production-readiness-fast: staging-preflight verify frontend-e2e-local frontend-e2e-auth-browser api-trace-smoke db-rollback-stop-notes-test");
    expect(makefile).toContain("production-readiness-local: production-readiness-fast perf-smoke");
    expect(makefile).toContain("container-build:");
    expect(makefile).toContain("staging-preflight: db-ensure-psql");
    expect(makefile).toContain("staging-signoff-check:");
    expect(makefile).toContain("production-env-check:");
    expect(makefile).toContain("api-trace-smoke: db-init-test");
    expect(makefile).toContain("perf-smoke: db-init-test");
    expect(makefile).toContain("db-rollback-stop-notes-test:");
    expect(makefile).toContain("ROLLBACK_TEST_DATABASE_NAME ?= sagittarius_rollback_test");
    expect(makefile).toContain("DROP TABLE IF EXISTS stop_notes");
    expect(apiMod).toContain(".route(\"/health\", get(health::liveness))");
    expect(apiMod).toContain(".route(\"/readiness\", get(health::readiness))");
    expect(apiMod).toContain("DefaultOnRequest::new().level(Level::INFO)");
    expect(apiMod).toContain("DefaultOnResponse::new().level(Level::INFO)");
    expect(apiMod).toContain("SAGITTARIUS_ALLOWED_ORIGINS");
    expect(apiMod).not.toContain("AllowOrigin::mirror_request()");
    expect(apiMain).toContain("EnvFilter::try_from_default_env()");
    expect(apiMain).toContain("SAGITTARIUS_SEED_SAMPLE_DATA");
    expect(apiMain).toContain("TASK_ESIM_ID");
    expect(apiMain).toContain("EXPENSE_ID");
    expect(apiMain).not.toContain("gen_random_uuid()");
    expect(productionEnvCheck).toContain("EMAIL_DELIVERY");
    expect(productionEnvCheck).toContain("PASSKEY_ALLOWED_ORIGINS");
    expect(productionEnvCheck).toContain("SMTP_PASSWORD");
    expect(productionEnvCheck).toContain("SAGITTARIUS_INTERNAL_API_BASE_URL");
    expect(productionEnvCheck).not.toMatch(/\bstaging\b/i);
    expect(productionEnvExample).not.toMatch(/\bstaging\b/i);
    for (const signoffOnlyName of [
      "SAGITTARIUS_ALERT_RUNBOOK_URL",
      "SAGITTARIUS_ALERT_SINK_NAME",
      "SAGITTARIUS_FEATURE_OWNER",
      "SAGITTARIUS_ROLLBACK_OWNER",
      "SAGITTARIUS_SIGNOFF_ALERT_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_ALERT_ROUTING_VERIFIED",
      "SAGITTARIUS_SIGNOFF_API_BASE_URL",
      "SAGITTARIUS_SIGNOFF_BROWSER_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_BROWSER_PASSED",
      "SAGITTARIUS_SIGNOFF_DB_MIGRATION_VERIFIED",
      "SAGITTARIUS_SIGNOFF_ENVIRONMENT",
      "SAGITTARIUS_SIGNOFF_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_FRONTEND_URL",
      "SAGITTARIUS_SIGNOFF_ISSUE_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_MIGRATION_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_NO_P1_P2",
      "SAGITTARIUS_SIGNOFF_PREFLIGHT_PASSED",
      "SAGITTARIUS_SIGNOFF_ROLLBACK_EVIDENCE_URL",
      "SAGITTARIUS_SIGNOFF_ROLLBACK_VERIFIED",
      "SAGITTARIUS_STAGING_ALERT_EVIDENCE_URL",
      "SAGITTARIUS_STAGING_ALERT_ROUTING_VERIFIED",
      "SAGITTARIUS_STAGING_API_BASE_URL",
      "SAGITTARIUS_STAGING_BROWSER_EVIDENCE_URL",
      "SAGITTARIUS_STAGING_BROWSER_SIGNOFF",
      "SAGITTARIUS_STAGING_DB_MIGRATION_VERIFIED",
      "SAGITTARIUS_STAGING_ENVIRONMENT",
      "SAGITTARIUS_STAGING_EVIDENCE_URL",
      "SAGITTARIUS_STAGING_FRONTEND_URL",
      "SAGITTARIUS_STAGING_ISSUE_EVIDENCE_URL",
      "SAGITTARIUS_STAGING_MIGRATION_EVIDENCE_URL",
      "SAGITTARIUS_STAGING_NO_P1_P2",
      "SAGITTARIUS_STAGING_PREFLIGHT_PASSED",
      "SAGITTARIUS_STAGING_ROLLBACK_EVIDENCE_URL",
      "SAGITTARIUS_STAGING_ROLLBACK_VERIFIED",
    ]) {
      expect(productionEnvCheck).not.toContain(signoffOnlyName);
      expect(productionEnvExample).not.toContain(signoffOnlyName);
    }
    expect(productionEnvCheck).toContain("must not use placeholder domain");
    const stagingPreflight = readFileSync(join(frontendRoot, "scripts/check-staging-preflight.ts"), "utf8");
    const productionBrowserQa = readFileSync(join(frontendRoot, "scripts/run-local-production-browser-qa.ts"), "utf8");
    expect(productionBrowserQa).toContain('EMAIL_DELIVERY: "log"');
    expect(productionBrowserQa).toContain("Set password and continue");
    expect(productionBrowserQa).toContain("Verify email");
    expect(productionBrowserQa).not.toContain('name: /^Continue$/');
    expect(productionBrowserQa).not.toContain('name: /^Use password$/');
    expect(productionBrowserQa).not.toContain('name: /^Create my trip space$/');
    expect(productionBrowserQa).toContain("appRoutes.tripItinerary(tripId)");
    expect(productionBrowserQa).toContain("appRoutes.tripMembers(tripId)");
    expect(productionBrowserQa).not.toContain('a[href="/trips/${tripId}/itinerary"]');
    expect(productionBrowserQa).not.toContain('a[href="/trips/${tripId}/members"]');
    expect(stagingPreflight).toContain("SAGITTARIUS_REQUIRE_PREFLIGHT_API_CHECK");
    expect(stagingPreflight).toContain("/api/v1/health");
    expect(stagingPreflight).toContain("/api/v1/readiness");
    expect(authBrowserE2e).toContain('EMAIL_DELIVERY: "log"');
    expect(authBrowserE2e).toContain('SAGITTARIUS_ENV: "development"');
    expect(authBrowserE2e).toContain('SAGITTARIUS_ALLOW_LOCAL_CORS: "1"');
    expect(authBrowserE2e).toContain("SAGITTARIUS_INTERNAL_API_BASE_URL: apiBaseUrl");
    expect(packageJson.scripts?.start).toContain("${HOSTNAME:-127.0.0.1}");
    expect(workflow).toContain("postgres:17-alpine");
    expect(workflow).toContain("bun install --frozen-lockfile");
    expect(workflow).toContain("bunx playwright install --with-deps chromium");
    expect(workflow).toContain('SAGITTARIUS_PERF_SMOKE_MAX_P95_MS: "3000"');
    expect(workflow).toContain("make production-readiness-fast PSQL=psql");
    expect(workflow).toContain("name: Production container image build");
    expect(workflow).toContain("make container-build");
    expect(workflow).toContain(
      "make container-production-build PRODUCTION_ENV_FILE=.env.production.example",
    );
    expect(workflow).toContain("name: Release safety script checks");
    expect(workflow).toContain("bun run test:release-signoff");
    expect(workflow).toContain("bun run test:production-env");
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

function envFileValue(source: string, name: string): string {
  const line = source.split(/\r?\n/).find((entry) => entry.startsWith(`${name}=`));
  expect(line).toBeDefined();
  return line!.slice(name.length + 1).replace(/^"|"$/g, "");
}

function composeServiceBlock(source: string, serviceName: string): string {
  const marker = `  ${serviceName}:\n`;
  const start = source.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);

  const body = source.slice(start + marker.length);
  const nextServiceStart = body.search(/\n  [A-Za-z0-9_-]+:\n/);
  return nextServiceStart === -1 ? body : body.slice(0, nextServiceStart);
}

function collectSourceFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((entry) => {
    const filePath = join(root, entry);
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      if ([".next", "coverage", "node_modules", "target"].includes(entry)) return [];
      return collectSourceFiles(filePath);
    }
    return /\.(css|rs|ts|tsx)$/.test(entry) ? [filePath] : [];
  });
}
