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
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-trip-destinations.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-trip-dates.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-trip-credentials.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-access-error-codes.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-passkey-support.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-email-login-credentials-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-email-login-methods-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-email-login-otp-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-email-login-password-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-email-login-setup-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/portal-trip-wizard-dates-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/portal-trip-wizard-destination-step.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/account-access-panel/portal-trip-wizard-invite-review.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/trip-join-gate/trip-join-gate.support.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/trip-join-gate/trip-join-gate.styles.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinGateVisual.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/shared/components/date-time-pickers/DatePickerField.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/shared/components/date-time-pickers/DateTimePickerField.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/shared/components/date-time-pickers/TimePickerField.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/shared/components/date-time-pickers/DateTimePickerContent.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/shared/components/date-time-pickers/date-time-picker.styles.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/shared/components/date-time-pickers/date-time-picker.types.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/workspace/pages/trip-settings/TripSettingsPage.types.ts"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/overview/OverviewTaskDialog.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/RouteMapView.tsx"))).toBe(false);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/route-map/RouteMapView.tsx"))).toBe(true);
    expect(existsSync(join(frontendRoot, "src/features/itinerary/components/route-map/RouteMapUnresolvedPanel.tsx"))).toBe(true);
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

  it("uses Next App Router with trip-scoped production routes", () => {
    expect(readFileSync(join(frontendRoot, "app/page.tsx"), "utf8")).toContain("HomeLanding");
    expect(readFileSync(join(frontendRoot, "src/features/public-site/pages/home/HomeLanding.tsx"), "utf8")).toContain("LanguageSwitch");
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

  it("keeps account and trip access separated on production page routes", () => {
    expect(readFileSync(join(frontendRoot, "app/trips/new/page.tsx"), "utf8")).toContain('accessMode="account-login"');

    [
      "app/access/page.tsx",
      "app/trips/new/page.tsx",
      "app/trips/page.tsx",
      "app/portal/page.tsx",
      "app/portal/my-trips/page.tsx",
      "app/portal/explorer/page.tsx",
      "app/portal/to-dos/page.tsx",
      "app/portal/vault/page.tsx",
      "app/portal/settings/page.tsx",
      "app/portal/sign-out/page.tsx",
      "app/portal/trips/new/page.tsx",
    ].forEach((routeFile) => {
      const source = readFileSync(join(frontendRoot, routeFile), "utf8");
      expect(source).toContain("AccountApp");
      expect(source).not.toContain("SagittariusApp");
    });

    [
      "app/trips/page.tsx",
      "app/portal/page.tsx",
      "app/portal/my-trips/page.tsx",
      "app/portal/explorer/page.tsx",
      "app/portal/to-dos/page.tsx",
      "app/portal/vault/page.tsx",
      "app/portal/settings/page.tsx",
      "app/portal/sign-out/page.tsx",
      "app/portal/trips/new/page.tsx",
    ].forEach((routeFile) => {
      expect(readFileSync(join(frontendRoot, routeFile), "utf8")).toContain('accessMode="account-portal"');
    });

    [
      "app/join/page.tsx",
      "app/join/[joinCode]/page.tsx",
    ].forEach((routeFile) => {
      expect(readFileSync(join(frontendRoot, routeFile), "utf8")).toContain('accessMode="trip-access"');
    });

    const tripWorkspaceRoutes: Record<string, string> = {
      "app/trips/[tripId]/page.tsx": 'view="overview"',
      "app/trips/[tripId]/itinerary/page.tsx": 'view="itinerary"',
      "app/trips/[tripId]/map/page.tsx": 'view="map"',
      "app/trips/[tripId]/timeline/page.tsx": 'view="timeline"',
      "app/trips/[tripId]/bookings/page.tsx": 'view="bookings"',
      "app/trips/[tripId]/photos/page.tsx": 'view="photos"',
      "app/trips/[tripId]/members/page.tsx": 'view="members"',
      "app/trips/[tripId]/expenses/page.tsx": 'view="expenses"',
      "app/trips/[tripId]/settings/page.tsx": 'view="settings"',
    };

    Object.entries(tripWorkspaceRoutes).forEach(([routeFile, expectedView]) => {
      const source = readFileSync(join(frontendRoot, routeFile), "utf8");
      expect(source).toContain("TripWorkspaceApp");
      expect(source).toContain(expectedView);
      expect(source).not.toContain("SagittariusApp");
    });

    expect(readFileSync(join(frontendRoot, "src/features/workspace/components/app-shell/AppShell.tsx"), "utf8")).toContain("@/src/trip/workspace/planning-view");
    expect(readFileSync(join(frontendRoot, "src/routes/app-routes.ts"), "utf8")).toContain("@/src/trip/workspace/planning-view");
    expect(readFileSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceApp.tsx"), "utf8")).toContain(
      "@/src/trip/workspace/SagittariusApp",
    );
    expect(readFileSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceApp.tsx"), "utf8")).not.toContain(
      "@/src/app/SagittariusApp",
    );
    expect(readFileSync(join(frontendRoot, "src/features/workspace/components/app-shell/AppShell.tsx"), "utf8")).not.toContain("@/src/app/SagittariusApp");
    expect(readFileSync(join(frontendRoot, "src/routes/app-routes.ts"), "utf8")).not.toContain("@/src/app/SagittariusApp");

    const sagaCore = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/SagittariusAppCore.tsx"),
      "utf8",
    );
    const workspaceFacade = readFileSync(
      join(frontendRoot, "src/trip/workspace/SagittariusApp.tsx"),
      "utf8",
    );
    const appFacade = readFileSync(join(frontendRoot, "src/app/SagittariusApp.tsx"), "utf8");
    const workspaceRecordsHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/use-trip-workspace-records.ts"),
      "utf8",
    );
    const importHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-itinerary-import.ts"),
      "utf8",
    );
    const workspaceDialogs = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/WorkspaceDialogs.tsx"),
      "utf8",
    );
    const bookingDisplay = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/bookings-docs/booking-display.ts"),
      "utf8",
    );
    const bookingFolders = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/bookings-docs/booking-folders.ts"),
      "utf8",
    );
    const bookingList = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/bookings-docs/booking-list.ts"),
      "utf8",
    );
    const bookingDialog = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/bookings-docs/components/BookingDialog.tsx"),
      "utf8",
    );
    const itineraryTimeLib = readFileSync(
      join(frontendRoot, "src/features/itinerary/lib/itinerary-time.ts"),
      "utf8",
    );
    const overviewPage = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/OverviewPage.tsx"),
      "utf8",
    );
    const overviewTaskDialog = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/overview/OverviewTaskDialog.tsx"),
      "utf8",
    );
    const routeMapTypes = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/route-map/route-map.types.ts"),
      "utf8",
    );
    const routeMapView = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/route-map/RouteMapView.tsx"),
      "utf8",
    );
    const routeMapUnresolvedPanel = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/route-map/RouteMapUnresolvedPanel.tsx"),
      "utf8",
    );
    const routeMapUtils = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/route-map/route-map.utils.ts"),
      "utf8",
    );
    const stopDialog = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/StopDialog.tsx"),
      "utf8",
    );
    const stopDialogForm = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/stop-dialog/stop-dialog.form.ts"),
      "utf8",
    );
    const tripSettingsPageSource = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/trip-settings/TripSettingsPage.tsx"),
      "utf8",
    );
    const tripSettingsIndexSource = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/trip-settings/index.ts"),
      "utf8",
    );
    const memberSupport = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/members/TripMembersPage.support.ts"),
      "utf8",
    );
    const accountTripWizardSupport = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/account-trip-wizard-support.ts"),
      "utf8",
    );
    const portalTripWizard = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/portal-trip-wizard.tsx"),
      "utf8",
    );
    const accountAuthSupport = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/account-auth-support.ts"),
      "utf8",
    );
    const emailLoginStepContent = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/account-email-login-step-content.tsx"),
      "utf8",
    );
    const dateTimePickers = readFileSync(
      join(frontendRoot, "src/shared/components/date-time-pickers/DateTimePickers.tsx"),
      "utf8",
    );
    const tripJoinGate = readFileSync(
      join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinGate.tsx"),
      "utf8",
    );
    const tripJoinGateVisual = readFileSync(
      join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinGateVisual.tsx"),
      "utf8",
    );
    const tripJoinGateStyles = readFileSync(
      join(frontendRoot, "src/features/account/components/trip-join-gate/trip-join-gate.styles.ts"),
      "utf8",
    );
    const tripWizardFormSections = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/portal-trip-wizard-form-sections.tsx"),
      "utf8",
    );
    expect(workspaceFacade).toContain("./sagittarius-app");
    expect(appFacade).toContain("@/src/trip/workspace/sagittarius-app");
    expect(appFacade).not.toContain('"use client"');
    const sagittariusApp = sagaCore;
    expect(sagaCore).toContain("@/src/trip/workspace/TripWorkspaceFrame");
    expect(sagaCore).toContain("@/src/trip/workspace/TripWorkspaceRail");
    expect(sagaCore).toContain("@/src/trip/workspace/TripWorkspaceViews");
    expect(sagaCore).toContain("./WorkspaceDialogs");
    expect(workspaceDialogs).toContain("@/src/trip/workspace/TripWorkspaceDeleteDialog");
    expect(workspaceDialogs).toContain("@/src/trip/workspace/TripWorkspaceImportDialog");
    expect(bookingDisplay).toContain("export function formatDateTime");
    expect(bookingDisplay).toContain("export function bookingTypeIcon");
    expect(bookingDisplay).not.toContain("function toDateTimeLocalValue");
    expect(bookingDisplay).not.toContain("function fromDateTimeLocalValue");
    expect(bookingDisplay).not.toContain("function toggleId");
    expect(bookingDisplay).not.toContain("bookingFolders");
    expect(bookingDisplay).not.toContain("bookingDocMatchesQuery");
    expect(bookingDisplay).not.toContain("compareBookingStartWithUndated");
    expect(bookingFolders).toContain("export const bookingFolders");
    expect(bookingFolders).toContain("export function countBookingFolders");
    expect(bookingList).toContain("export function bookingDocMatchesQuery");
    expect(bookingList).toContain("export function compareBookingStartWithUndated");
    expect(bookingDialog).toContain("@/src/features/itinerary/lib/itinerary-time");
    expect(bookingDialog).toContain("@/src/features/itinerary/lib/itinerary-item-helpers");
    expect(itineraryTimeLib).toContain("@/src/trip/itinerary-time");
    expect(itineraryTimeLib).not.toContain("/^(\\d{2}):(\\d{2})$/");
    expect(overviewPage).toContain("OverviewTaskDialog");
    expect(overviewPage).not.toContain("taskDialogGridClassName");
    expect(overviewTaskDialog).toContain("export function OverviewTaskDialog");
    expect(overviewTaskDialog).toContain("taskDialogGridClassName");
    expect(routeMapTypes).toContain("export interface MapCoordinateResolutionResult");
    expect(routeMapView).not.toContain("export interface MapCoordinateResolutionResult");
    expect(routeMapView).toContain("RouteMapUnresolvedPanel");
    expect(routeMapView).not.toContain("unresolvedPanelListClassName");
    expect(routeMapUnresolvedPanel).toContain("unresolvedPanelListClassName");
    expect(routeMapUnresolvedPanel).toContain("export function RouteMapUnresolvedPanel");
    expect(routeMapUtils).not.toContain("export type { DayColorStyle");
    expect(stopDialog).toContain("applyStopActivityInput");
    expect(stopDialog).not.toContain("parseRouteActivity");
    expect(stopDialog).not.toContain("endOffsetDaysBetweenTimes");
    expect(stopDialogForm).toContain("export function applyStopStartTime");
    expect(stopDialogForm).toContain("export function applyStopActivityInput");
    expect(tripSettingsPageSource).not.toContain("export interface TripSettingsFormValues");
    expect(tripSettingsIndexSource).toContain("./TripSettingsPage.types");
    expect(memberSupport).toContain("@/src/routes/invite-links");
    expect(memberSupport).not.toContain("function buildInviteLink");
    expect(accountTripWizardSupport).toContain("@/src/routes/invite-links");
    expect(accountTripWizardSupport).toContain("./account-trip-credentials");
    expect(accountTripWizardSupport).toContain("./account-trip-destinations");
    expect(accountTripWizardSupport).toContain("./account-trip-dates");
    expect(accountTripWizardSupport).not.toContain("function buildInviteLink");
    expect(accountTripWizardSupport).not.toContain("function buildInviteEmailHref");
    expect(accountTripWizardSupport).not.toContain("function routeCalendarDays");
    expect(accountTripWizardSupport).not.toContain("function tripNightCount");
    expect(accountTripWizardSupport).not.toContain("const tripCountryOptions");
    expect(accountTripWizardSupport).not.toContain("const tripCityOptions");
    expect(accountTripWizardSupport).not.toContain("function tripDestinationCards");
    expect(accountTripWizardSupport).not.toContain("function destinationRouteCode");
    expect(accountTripWizardSupport).not.toContain("function generateJoinIdForTrip");
    expect(accountTripWizardSupport).not.toContain("function generateJoinPassword");
    expect(accountTripWizardSupport).not.toContain("function randomToken");
    expect(accountTripWizardSupport).toContain("export function applyTripDestinationCities");
    expect(accountTripWizardSupport).toContain("export function applyTripCalendarDate");
    expect(portalTripWizard).toContain("applyTripDestinationCities");
    expect(portalTripWizard).toContain("applyTripCalendarDate");
    expect(portalTripWizard).not.toContain("Date.parse(`${date}T00:00:00`)");
    expect(accountAuthSupport).toContain("./account-access-error-codes");
    expect(accountAuthSupport).toContain("./account-passkey-support");
    expect(accountAuthSupport).not.toContain("accountLoadFailed:");
    expect(accountAuthSupport).not.toContain("function createPasskeyCredential");
    expect(accountAuthSupport).not.toContain("function getPasskeyCredential");
    expect(accountAuthSupport).not.toContain("function base64UrlToArrayBuffer");
    expect(accountAuthSupport).not.toContain("function arrayBufferToBase64Url");
    expect(emailLoginStepContent).toContain("./account-email-login-credentials-step");
    expect(emailLoginStepContent).toContain("./account-email-login-methods-step");
    expect(emailLoginStepContent).toContain("./account-email-login-otp-step");
    expect(emailLoginStepContent).toContain("./account-email-login-password-step");
    expect(emailLoginStepContent).toContain("./account-email-login-setup-step");
    expect(emailLoginStepContent).not.toContain("interface EmailLoginCredentialsStepProps");
    expect(emailLoginStepContent).not.toContain("function EmailLoginCredentialsStep");
    expect(emailLoginStepContent).not.toContain("function EmailLoginOtpStep");
    expect(emailLoginStepContent).not.toContain("function EmailLoginPasswordStep");
    expect(dateTimePickers).toContain("./DatePickerField");
    expect(dateTimePickers).toContain("./DateTimePickerField");
    expect(dateTimePickers).toContain("./TimePickerField");
    expect(dateTimePickers).not.toContain("function CalendarContent");
    expect(dateTimePickers).not.toContain("function TimePickerContent");
    expect(dateTimePickers).not.toContain("createPortal");
    expect(tripJoinGate).toContain("./trip-join-gate.support");
    expect(tripJoinGate).toContain("TripJoinGateVisual");
    expect(tripJoinGate).not.toContain("tripAccessPhotoKrabiClassName");
    expect(tripJoinGateVisual).toContain("export function TripJoinGateVisual");
    expect(tripJoinGateVisual).toContain("tripAccessPhotoKrabiClassName");
    expect(tripJoinGateStyles).toContain("tripAccessRightColumnClassName");
    expect(tripJoinGate).not.toContain("function tripFromJoinResponse");
    expect(tripJoinGate).not.toContain("function friendlyErrorText");
    expect(tripJoinGate).not.toContain("assertMainPlanPointerAliasesMatch");
    expect(tripWizardFormSections).toContain("./portal-trip-wizard-invite-review");
    expect(tripWizardFormSections).toContain("./portal-trip-wizard-dates-step");
    expect(tripWizardFormSections).toContain("./portal-trip-wizard-destination-step");
    expect(tripWizardFormSections).not.toContain("interface TripWizardDestinationStepProps");
    expect(tripWizardFormSections).not.toContain("interface TripWizardDatesStepProps");
    expect(tripWizardFormSections).not.toContain("function TripWizardInviteStep");
    expect(tripWizardFormSections).not.toContain("function TripWizardReviewSummary");
    expect(sagaCore).toContain("@/src/trip/workspace/selected-trip-plan");
    expect(sagaCore).toContain("@/src/trip/workspace/use-backend-expense-summary");
    expect(sagaCore).toContain("@/src/trip/workspace/use-daily-briefings");
    expect(sagaCore).toContain("@/src/trip/workspace/use-itinerary-path-workspace");
    expect(sagaCore).toContain("@/src/trip/workspace/use-trip-workspace-records");
    expect(sagaCore).toContain("useWorkspacePhotoAlbums");
    expect(sagaCore).toContain("useWorkspaceRecords");
    expect(sagaCore).toContain("useWorkspaceAdministration");
    expect(sagaCore).toContain("useWorkspaceBookingCommands");
    expect(sagaCore).toContain("useWorkspaceItineraryCommands");
    expect(sagaCore).toContain("useWorkspaceItineraryImport");
    expect(sagaCore).not.toContain("useWorkspaceRecordState");
    expect(sagaCore).not.toContain("useWorkspaceRecordActions");
    expect(sagaCore).toContain("./hooks");
    expect(sagaCore).toContain("@/src/trip/workspace/use-trip-workspace-state");
    expect(sagaCore).toContain("@/src/trip/workspace/use-workspace-chrome");
    expect(sagaCore).toContain("@/src/trip/workspace/use-workspace-navigation");
    expect(sagaCore).not.toContain('from "@/src/components/ContextRail"');
    expect(sagaCore).not.toContain("workspaceGridClassName");
    expect(sagaCore).not.toContain("planningMainClassName");
    expect(sagaCore).not.toContain("delete-confirm-dialog");
    expect(sagaCore).not.toContain("appDeleteDialogTitleClassName");
    expect(sagaCore).not.toContain("import-options-dialog");
    expect(sagaCore).not.toContain("ItineraryImportOptionsDialog");
    expect(sagaCore).not.toContain("function buildImportedPlanRecordsForTripPlan");
    expect(sagaCore).not.toContain("function mergeApiImportedPlanRecordsIntoTrip");
    expect(sagaCore).not.toContain("function mergeImportedRecordsIntoTripPlan");
    expect(sagaCore).not.toContain("function buildImportedItineraryItemCreateRequest");
    expect(sagaCore).not.toContain("upsertById");
    expect(sagaCore).not.toContain("async function createImportedPlanRecordsViaApi");
    expect(sagittariusApp).not.toContain("function shouldUseApiItineraryImport");
    expect(sagittariusApp).not.toContain("interface PendingItineraryImport");
    expect(sagittariusApp).not.toContain("resolveViewFromPath");
    expect(sagittariusApp).not.toContain("navigatedView");
    expect(sagittariusApp).not.toContain("setContextRailMounted");
    expect(sagittariusApp).not.toContain("setSidebarCollapsed");
    expect(sagittariusApp).not.toContain("setToastDismissed");
    expect(sagittariusApp).not.toContain("setToastDismissing");
    expect(sagittariusApp).not.toContain("buildFallbackBriefings");
    expect(sagittariusApp).not.toContain("buildPatchDailyBriefingRequest");
    expect(sagittariusApp).not.toContain("useState<{ tripPlanId: string; summary: ExpenseSummary } | null>");
    expect(importHook).toContain("@/src/trip/workspace/itinerary-import-model");
    expect(importHook).toContain("@/src/trip/workspace/itinerary-import-api");
    expect(workspaceRecordsHook).toContain("@/src/trip/workspace/trip-plan-records");
    expect(sagittariusApp).not.toContain("@/src/trip/trip-fixtures");
    expect(sagittariusApp).not.toContain("tripFixtureSuggestions");
    expect(sagittariusApp).not.toContain("tripFixtureTasks");
    expect(sagittariusApp).not.toContain("tripFixtureStopNotes");
    expect(sagittariusApp).not.toContain("function resolveSelectedTripPlanId");
    expect(sagittariusApp).not.toContain("function rememberSelectedTripPlanId");
    expect(sagittariusApp).not.toContain("function selectTripPlanRecords");
    expect(sagittariusApp).not.toContain("function tripPlanIdForRecord");
    expect(sagittariusApp).not.toContain("buildItineraryCommitmentsByItemId");
    expect(sagittariusApp).not.toContain("buildExpenseSummary");
    expect(sagittariusApp).not.toContain("function loadPersistedParticipantSession");
    expect(sagittariusApp).not.toContain("function clearParticipantSession");
    expect(sagittariusApp).not.toContain("function loadPersistedTrip");
    expect(sagittariusApp).not.toContain("function persistTripDraft");
    expect(sagittariusApp).not.toContain("useState<ItineraryPathSelection>");
    expect(sagittariusApp).not.toContain("function changeTripPath");
    expect(sagittariusApp).not.toContain("function toggleShowAllPaths");
    expect(sagittariusApp).not.toContain("past: Trip[]");
    expect(sagittariusApp).not.toContain("future: Trip[]");
    expect(sagittariusApp).not.toContain("function replaceTripParticipant");
    expect(sagittariusApp).not.toContain("function appendTripParticipant");
    expect(sagittariusApp).not.toContain("function nextLocalItemId");
    expect(sagittariusApp).not.toContain("function nextLocalSuggestionId");
    expect(sagittariusApp).not.toContain("function nextLocalTaskId");
    expect(sagittariusApp).not.toContain("function nextLocalStopNoteId");
    expect(sagittariusApp).not.toContain("function nextLocalBookingDocId");
    expect(sagittariusApp).not.toContain("function nextLocalPhotoAlbumId");
    expect(sagittariusApp).not.toContain("function nextLocalPlanVariantId");
    expect(sagittariusApp).not.toContain("function nextLocalExpenseId");
    expect(sagittariusApp).not.toContain("function nextClientMutationId");
    expect(sagittariusApp).not.toContain("function normalizeTripPlanAliases");
    expect(sagittariusApp).not.toContain("function buildSetMainTripPlanRequest");
    expect(sagittariusApp).not.toContain("function buildPatchTripPlanStatusRequest");
    expect(sagittariusApp).not.toContain("function buildRenameTripPlanRequest");
    expect(sagittariusApp).not.toContain("function buildCreateTripPlanRequest");
    expect(sagittariusApp).not.toContain("function buildCreateMemberRequest");
    expect(sagittariusApp).not.toContain("function buildPatchMemberRoleRequest");
    expect(sagittariusApp).not.toContain("function buildPatchMemberAccessStatusRequest");
    expect(sagittariusApp).not.toContain("function buildPatchMemberPasswordRequest");
    expect(sagittariusApp).not.toContain("function buildUpdatePresenceRequest");
    expect(sagittariusApp).not.toContain("function updateTripPlanInTrip");
    expect(sagittariusApp).not.toContain("function mergePublishedTripPlan");
    expect(sagittariusApp).not.toContain("function setLocalMainTripPlan");
    expect(sagittariusApp).not.toContain("function createLocalTripPlan");
    expect(sagittariusApp).not.toContain("function buildCreateEditSuggestionRequest");
    expect(sagittariusApp).not.toContain("function createLocalEditSuggestion");
    expect(sagittariusApp).not.toContain("function rejectSuggestionById");
    expect(sagittariusApp).not.toContain("function buildPatchDailyBriefingRequest");
    expect(sagittariusApp).not.toContain("function applyDailyBriefingOverrides");
    expect(sagittariusApp).not.toContain("function buildPatchTripSettingsRequest");
    expect(sagittariusApp).not.toContain("function applyTripSettingsToTrip");
    expect(sagittariusApp).not.toContain("function mergePatchedTripSettings");
    expect(sagittariusApp).not.toContain("function normalizeTripPlanSummary");
    expect(sagittariusApp).not.toContain("function planStatusForLegacyKind");
    expect(sagittariusApp).not.toContain("function legacyKindForPlanStatus");
    expect(sagittariusApp).not.toContain("function daysBetweenIsoDates");
    expect(sagittariusApp).not.toContain("function shiftIsoDate");
    expect(sagittariusApp).not.toContain("function itineraryDateTime");
    expect(sagittariusApp).not.toContain("function buildItineraryItemDraft");
    expect(sagittariusApp).not.toContain("function buildUpdatedItineraryItem");
    expect(sagittariusApp).not.toContain("function appendItineraryItemToTrip");
    expect(sagittariusApp).not.toContain("function appendItineraryItemPlacement");
    expect(sagittariusApp).not.toContain("function mergeCreatedItineraryItemIntoTrip");
    expect(sagittariusApp).not.toContain("function mergeUpdatedItineraryBranchIntoTrip");
    expect(sagittariusApp).not.toContain("function shiftItineraryItemsToStartDate");
    expect(sagittariusApp).not.toContain("function buildInlineItineraryItemPatch");
    expect(sagittariusApp).not.toContain("function buildInlineItineraryItemPatchRequest");
    expect(sagittariusApp).not.toContain("function buildCreateItineraryItemRequest");
    expect(sagittariusApp).not.toContain("function buildPatchItineraryItemRequest");
    expect(sagittariusApp).not.toContain("function buildMoveItineraryItemRequest");
    expect(sagittariusApp).not.toContain("function buildMoveItineraryItemToDayRequest");
    expect(sagittariusApp).not.toContain("function buildReorderItineraryItemsRequest");
    expect(sagittariusApp).not.toContain("function buildShiftItineraryItemDayRequest");
    expect(sagittariusApp).not.toContain("function normalizeInlineTimePatch");
    expect(sagittariusApp).not.toContain("function createLocalBookingDoc");
    expect(sagittariusApp).not.toContain("function replaceBookingDocInTrip");
    expect(sagittariusApp).not.toContain("function updateLocalBookingDocInTrip");
    expect(sagittariusApp).not.toContain("function removeBookingDocFromTrip");
    expect(sagittariusApp).not.toContain("function serializeBookingDocInputForApi");
    expect(sagittariusApp).not.toContain("function normalizeBookingDocDateTimeForApi");
    expect(sagittariusApp).not.toContain("function bookingTypeForItineraryItem");
    expect(sagittariusApp).not.toContain("function syncItineraryDetailsWithBookingTicket");
    expect(sagittariusApp).not.toContain("function clearItineraryBookingTicketDetails");
    expect(sagittariusApp).not.toContain("function findDuplicateBookingDoc");
    expect(sagittariusApp).not.toContain("function buildCreateBookingDocRequest");
    expect(sagittariusApp).not.toContain("function buildPatchBookingDocRequest");
    expect(sagittariusApp).not.toContain("function bookingDraftTitleForItineraryItem");
    expect(sagittariusApp).not.toContain("function bookingTypeForExpenseEstimate");
    expect(sagittariusApp).not.toContain("function bookingDocInputForExpenseEstimate");
    expect(sagittariusApp).not.toContain("function bookingDraftDetailsForItineraryItem");
    expect(sagittariusApp).not.toContain("function bookingDraftTimeWindowForItineraryItem");
    expect(sagittariusApp).not.toContain("function createLocalPhotoAlbum");
    expect(sagittariusApp).not.toContain("function buildCreatePhotoAlbumRequest");
    expect(sagittariusApp).not.toContain("function buildPatchPhotoAlbumRequest");
    expect(sagittariusApp).not.toContain("function appendPhotoAlbumToTrip");
    expect(sagittariusApp).not.toContain("function replacePhotoAlbumInTrip");
    expect(sagittariusApp).not.toContain("function updateLocalPhotoAlbum");
    expect(sagittariusApp).not.toContain("function updateLocalPhotoAlbumInTrip");
    expect(sagittariusApp).not.toContain("function removePhotoAlbumFromTrip");
    expect(sagittariusApp).not.toContain('from "@/src/trip/photo-albums"');
    expect(sagittariusApp).not.toContain("async function createPhotoAlbum");
    expect(sagittariusApp).not.toContain("async function updatePhotoAlbum");
    expect(sagittariusApp).not.toContain("async function deletePhotoAlbum");
    expect(sagittariusApp).not.toContain("function buildExpenseCreateDrafts");
    expect(sagittariusApp).not.toContain("function buildCreateExpenseRequest");
    expect(sagittariusApp).not.toContain("function buildPatchExpenseRequest");
    expect(sagittariusApp).not.toContain("function appendExpensesToTrip");
    expect(sagittariusApp).not.toContain("function appendLocalExpensesToTrip");
    expect(sagittariusApp).not.toContain("function buildExpenseUpdateDraft");
    expect(sagittariusApp).not.toContain("function replaceExpenseInTrip");
    expect(sagittariusApp).not.toContain("function updateLocalExpenseInTrip");
    expect(sagittariusApp).not.toContain("function removeExpenseFromTrip");
    expect(sagittariusApp).not.toContain("function expenseReminderRequestForSuggestion");
    expect(sagittariusApp).not.toContain("function buildExpenseReminderRequest");
    expect(sagittariusApp).not.toContain("function recordLocalExpenseReminderInTrip");
    expect(sagittariusApp).not.toContain("function createLocalStopNote");
    expect(sagittariusApp).not.toContain("function buildCreateStopNoteRequest");
    expect(sagittariusApp).not.toContain("function buildPatchStopNoteRequest");
    expect(sagittariusApp).not.toContain("function appendStopNote");
    expect(sagittariusApp).not.toContain("function createLocalStopNoteInList");
    expect(sagittariusApp).not.toContain("function replaceStopNote");
    expect(sagittariusApp).not.toContain("function updateLocalStopNote");
    expect(sagittariusApp).not.toContain("function removeStopNote");
    expect(sagittariusApp).not.toContain("function deleteLocalStopNote");
    expect(sagittariusApp).not.toContain("function buildTaskCreateDraft");
    expect(sagittariusApp).not.toContain("function buildCreateTaskRequest");
    expect(sagittariusApp).not.toContain("function createLocalTask");
    expect(sagittariusApp).not.toContain("function appendTask");
    expect(sagittariusApp).not.toContain("function createLocalTaskInList");
    expect(sagittariusApp).not.toContain("function replaceTask");
    expect(sagittariusApp).not.toContain("function toggledTaskStatus");
    expect(sagittariusApp).not.toContain("function buildToggleTaskStatusRequest");
    expect(sagittariusApp).not.toContain("function toggleLocalTaskStatus");
    expect(sagittariusApp).not.toContain("function TripAccessLoadingFrame");
    expect(sagittariusApp).not.toContain("function WorkspaceToast");
    expect(sagittariusApp).not.toContain("Role preview");
    expect(sagittariusApp).toContain("WorkspaceRolePreview");
    expect(sagittariusApp).not.toContain("workspaceToastDismissClassName");
    expect(sagittariusApp).not.toContain("portalLoadingCardClassName");
    expect(sagittariusApp).not.toContain("function buildMapLink");
    expect(sagittariusApp).not.toContain("function buildMapPlaceResolutionRequest");
    expect(sagittariusApp).not.toContain("function mapResolutionPlaceHint");
    expect(sagittariusApp).not.toContain("function mapResolutionActivity");
    expect(sagittariusApp).not.toContain("function resolveStopPlace");
    expect(sagittariusApp).not.toContain("function locationFieldsFromCandidate");
    expect(sagittariusApp).not.toContain("function readItineraryDetailString");
    expect(sagittariusApp).not.toContain("function normalizeExpenseRepeatCount");
    expect(sagittariusApp).not.toContain("function repeatExpenseLineItems");
    expect(sagittariusApp).not.toContain("function buildImportItineraryRequest");
    expect(sagittariusApp).not.toContain("function resolveCreatedImportId");
    expect(sagittariusApp).not.toContain("function serializePhotoAlbumInputForApi");
    expect(sagittariusApp).not.toContain("function deriveTripCountriesFromDestination");
    expect(sagittariusApp).not.toContain("async function patchApiItineraryBranchItems");
    expect(sagittariusApp).not.toContain("function buildItineraryCommitmentsByItemId");
    expect(sagittariusApp).not.toContain("function selectedItineraryPathIdForDay");
    expect(sagittariusApp).not.toContain("function updateItineraryPathSelection");
    expect(sagittariusApp).not.toContain("function itineraryItemPathFieldsForTarget");
    expect(sagittariusApp).not.toContain("function getNextSortOrder");
    expect(sagittariusApp).not.toContain("function getNextChildSortOrder");
    expect(sagittariusApp).not.toContain("function normalizeStopHierarchyValues");
    expect(sagittariusApp).not.toContain("function replaceItineraryItem");
    expect(sagittariusApp).not.toContain("function replaceItineraryItems");
    expect(sagittariusApp).not.toContain("function deleteItineraryItemFromTrip");
    expect(sagittariusApp).not.toContain("function moveTripItem");
    expect(sagittariusApp).not.toContain("function moveTripItemToDay");
    expect(sagittariusApp).not.toContain("function moveTripItemIntoPlanBlock");
    expect(sagittariusApp).not.toContain("function hasDescendantItem");
    expect(sagittariusApp).not.toContain("function isUnauthenticated");
    expect(sagittariusApp).not.toContain("function isForbidden");
    expect(sagittariusApp).not.toContain("function isAuthFailure");
    expect(sagittariusApp).not.toContain("function slugifyFilePart");
    expect(sagittariusApp).not.toContain("function replaceSuggestionById");
    expect(sagittariusApp).not.toContain("function resolveJoinPostAuthReturnTo");
    expect(sagittariusApp).not.toContain('from "@/src/components/OverviewPage"');
    expect(sagittariusApp).not.toContain('from "@/src/components/TimelineView"');

    const tripSettingsPage = readFileSync(join(frontendRoot, "src/features/workspace/pages/trip-settings/TripSettingsPage.tsx"), "utf8");
    expect(tripSettingsPage).toContain("@/src/trip/itinerary-time");
    expect(tripSettingsPage).not.toContain("function daysBetweenIsoDates");
    expect(tripSettingsPage).not.toContain("function shiftIsoDate");
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
