import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot, repoRoot } from "./project-contract.helpers";
import {
  frontendScaffoldPathsAbsent,
  frontendScaffoldPathsPresent,
  repoScaffoldPathsAbsent,
  repoScaffoldPathsPresent,
} from "./project-contract.scaffold-paths";

describe("Sagittarius project scaffold", () => {
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

  it("keeps shared UI primitives split by responsibility", () => {
    const uiIndex = readFileSync(join(frontendRoot, "src/ui/index.ts"), "utf8");
    const primitives = readFileSync(join(frontendRoot, "src/ui/primitives.tsx"), "utf8");
    const primitiveStyles = readFileSync(join(frontendRoot, "src/ui/primitive-styles.ts"), "utf8");
    const workspacePrimitives = readFileSync(join(frontendRoot, "src/ui/workspace-primitives.tsx"), "utf8");

    expect(uiIndex).toContain("./primitives");
    expect(uiIndex).toContain("./workspace-primitives");
    expect(primitives).toContain("export function Button");
    expect(primitives).toContain("export function Badge");
    expect(primitives).toContain("./primitive-styles");
    expect(primitives).not.toContain("const buttonBaseClassName");
    expect(primitiveStyles).toContain("export const buttonBaseClassName");
    expect(primitiveStyles).toContain("export const badgeBaseClassName");
    expect(primitives).not.toContain("export function WorkspaceSurface");
    expect(primitives).not.toContain("fieldControlClassName");
    expect(workspacePrimitives).toContain("export function WorkspaceSurface");
    expect(workspacePrimitives).toContain("export function WorkspacePage");
    expect(workspacePrimitives).toContain("export const fieldControlClassName");
  });

  it("keeps AppShell split into component, styles, and support logic", () => {
    const appShell = readFileSync(join(frontendRoot, "src/features/workspace/components/app-shell/AppShell.tsx"), "utf8");
    const appShellMemberCard = readFileSync(join(frontendRoot, "src/features/workspace/components/app-shell/AppShellMemberCard.tsx"), "utf8");
    const appShellStyles = readFileSync(join(frontendRoot, "src/features/workspace/components/app-shell/AppShell.styles.ts"), "utf8");
    const appShellSupport = readFileSync(join(frontendRoot, "src/features/workspace/components/app-shell/app-shell.support.ts"), "utf8");

    expect(appShell).toContain("./AppShell.styles");
    expect(appShell).toContain("./AppShellMemberCard");
    expect(appShell).toContain("./app-shell.support");
    expect(appShell).not.toContain("const appLayoutClassName");
    expect(appShell).not.toContain("identityDialogOpen");
    expect(appShell).not.toContain("function roleLabel");
    expect(appShellMemberCard).toContain("export function AppShellMemberCard");
    expect(appShellMemberCard).toContain("identityDialogOpen");
    expect(appShellStyles).toContain("export const appLayoutClassName");
    expect(appShellStyles).toContain("export const sideRailClassName");
    expect(appShellSupport).toContain("export function resolveViewFromPath");
    expect(appShellSupport).toContain("export function roleLabel");
  });

  it("keeps portal trip wizard model logic out of the render component", () => {
    const portalTripWizard = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard.tsx"), "utf8");
    const portalTripWizardModel = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/use-portal-trip-wizard-model.ts"), "utf8");
    const portalTripWizardSummary = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard-summary.ts"), "utf8");

    expect(portalTripWizard).toContain("./use-portal-trip-wizard-model");
    expect(portalTripWizard).not.toContain("const [countryQuery");
    expect(portalTripWizard).not.toContain("function regenerateCredentials");
    expect(portalTripWizardModel).toContain("export function usePortalTripWizardModel");
    expect(portalTripWizardModel).toContain("buildPortalTripWizardSummary");
    expect(portalTripWizardModel).not.toContain("wizard.status.required");
    expect(portalTripWizardModel).toContain("function regenerateCredentials");
    expect(portalTripWizardSummary).toContain("export function buildPortalTripWizardSummary");
    expect(portalTripWizardSummary).toContain("wizard.status.required");
  });

  it("keeps trip join gate authentication state split from render composition", () => {
    const tripJoinGate = readFileSync(join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinGate.tsx"), "utf8");
    const tripJoinGateState = readFileSync(join(frontendRoot, "src/features/account/components/trip-join-gate/use-trip-join-gate-state.ts"), "utf8");
    const tripJoinGateFormState = readFileSync(join(frontendRoot, "src/features/account/components/trip-join-gate/use-trip-join-gate-form-state.ts"), "utf8");
    const tripJoinGateSubmitActions = readFileSync(join(frontendRoot, "src/features/account/components/trip-join-gate/use-trip-join-gate-submit-actions.ts"), "utf8");

    expect(tripJoinGate).toContain("./use-trip-join-gate-state");
    expect(tripJoinGate).not.toContain("useState");
    expect(tripJoinGate).not.toContain("useEffect");
    expect(tripJoinGate).not.toContain("verifyTripCredentials");
    expect(tripJoinGate).not.toContain("function submitParticipant");
    expect(tripJoinGateState).toContain("export function useTripJoinGateState");
    expect(tripJoinGateState).toContain("useTripJoinGateFormState");
    expect(tripJoinGateState).toContain("useTripJoinGateSubmitActions");
    expect(tripJoinGateState).not.toContain("const [joinId");
    expect(tripJoinGateState).not.toContain("verifyTripCredentials");
    expect(tripJoinGateState).not.toContain("async function submitParticipant");
    expect(tripJoinGateFormState).toContain("export function useTripJoinGateFormState");
    expect(tripJoinGateSubmitActions).toContain("verifyTripCredentials");
    expect(tripJoinGateSubmitActions).toContain("async function submitParticipant");
  });

  it("keeps account access panel state split from render composition", () => {
    const accountPanel = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/AccountAccessPanel.tsx"), "utf8");
    const accountPanelContent = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/account-access-panel-content.tsx"), "utf8");
    const accountPanelState = readFileSync(join(frontendRoot, "src/features/account/components/account-access-panel/use-account-access-panel-state.ts"), "utf8");

    expect(accountPanel).toContain("./use-account-access-panel-state");
    expect(accountPanel).toContain("./account-access-panel-content");
    expect(accountPanel).not.toContain("useState");
    expect(accountPanel).not.toContain("useEffect");
    expect(accountPanel).not.toContain("useAccountPortalData");
    expect(accountPanel).not.toContain("clearAccountPortalDataCache");
    expect(accountPanel).not.toContain("./EmailLoginPanel");
    expect(accountPanel).not.toContain("../trip-join-gate/TripJoinGate");
    expect(accountPanelContent).toContain("./email-login");
    expect(accountPanelContent).toContain("@/src/features/account/components/trip-join-gate");
    expect(accountPanelContent).toContain("./portal");
    expect(accountPanelState).toContain("export function useAccountAccessPanelState");
    expect(accountPanelState).toContain("useAccountPortalData");
    expect(accountPanelState).toContain("clearAccountPortalDataCache");
  });

  it("keeps ActivityCell split into render, model, meta, and typed props", () => {
    const activityCell = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell.tsx"), "utf8");
    const activityCellMeta = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellMeta.tsx"), "utf8");
    const activityCellModel = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/use-activity-cell-model.ts"), "utf8");
    const activityCellTypes = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/activity-cell.types.ts"), "utf8");

    expect(activityCell).toContain("./activity-cell/use-activity-cell-model");
    expect(activityCell).toContain("./activity-cell/ActivityCellMeta");
    expect(activityCell).toContain("ActivityCellProps");
    expect(activityCell).not.toContain("useState");
    expect(activityCell).not.toContain("itemStatusLabel");
    expect(activityCellMeta).toContain("export function ActivityCellMeta");
    expect(activityCellModel).toContain("export function useActivityCellModel");
    expect(activityCellTypes).toContain("export interface ActivityCellProps");
  });

  it("keeps itinerary day group header split from row body rendering", () => {
    const dayGroup = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/day-group.tsx"), "utf8");
    const dayGroupHeader = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/DayGroupHeader.tsx"), "utf8");
    const dayGroupTypes = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/day-group.types.ts"), "utf8");

    expect(dayGroup).toContain("./DayGroupHeader");
    expect(dayGroup).toContain("./day-group.types");
    expect(dayGroup).not.toContain("DayTitleEditor");
    expect(dayGroup).not.toContain("DayPathControls");
    expect(dayGroupHeader).toContain("export function DayGroupHeader");
    expect(dayGroupHeader).toContain("DayTitleEditor");
    expect(dayGroupHeader).toContain("DayPathControls");
    expect(dayGroupTypes).toContain("export interface DayGroupProps");
  });

  it("keeps trip plan controls state split from control rendering", () => {
    const controls = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/SmartItineraryTableTripPlanControls.tsx"), "utf8");
    const controlsState = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/use-trip-plan-controls-state.ts"), "utf8");

    expect(controls).toContain("./use-trip-plan-controls-state");
    expect(controls).not.toContain("useState");
    expect(controls).not.toContain("function submitNewTripPlan");
    expect(controls).not.toContain("tripPlanStatus(");
    expect(controlsState).toContain("export function useTripPlanControlsState");
    expect(controlsState).toContain("function submitNewTripPlan");
    expect(controlsState).toContain("tripPlanStatus(");
  });

  it("keeps inline option picker menu rendering split from trigger state", () => {
    const picker = readFileSync(join(frontendRoot, "src/features/itinerary/components/inline-option-picker.tsx"), "utf8");
    const pickerMenu = readFileSync(join(frontendRoot, "src/features/itinerary/components/inline-option-picker-menu.tsx"), "utf8");

    expect(picker).toContain("./inline-option-picker-menu");
    expect(picker).not.toContain("createPortal");
    expect(picker).not.toContain("floatingOptionMenuClassName");
    expect(picker).not.toContain("sideMenuFloatingLeft");
    expect(pickerMenu).toContain("export function InlineOptionPickerMenu");
    expect(pickerMenu).toContain("createPortal");
    expect(pickerMenu).toContain("sideMenuFloatingLeft");
  });

  it("keeps itinerary ticket modal form state split from modal render", () => {
    const ticketModal = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryTicketModal.tsx"), "utf8");
    const bookingButton = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryBookingButton.tsx"), "utf8");
    const exports = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/components.tsx"), "utf8");
    const ticketFooter = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryTicketModalFooter.tsx"), "utf8");
    const ticketSections = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryTicketModalSections.tsx"), "utf8");
    const ticketModel = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/use-itinerary-ticket-modal-model.ts"), "utf8");

    expect(ticketModal).toContain("./use-itinerary-ticket-modal-model");
    expect(bookingButton).toContain("export function ItineraryBookingButton");
    expect(bookingButton).toContain("./ItineraryTicketModal");
    expect(exports).toContain("./activity-cell/ItineraryBookingButton");
    expect(exports).toContain("./activity-cell/ItineraryTicketModal");
    expect(exports).not.toContain("BookingComponents");
    expect(ticketModal).toContain("./ItineraryTicketModalFooter");
    expect(ticketModal).toContain("./ItineraryTicketModalSections");
    expect(ticketModal).not.toContain("useState");
    expect(ticketModal).not.toContain("buildTicketSubmitInput");
    expect(ticketModal).not.toContain("formatBookingSummary");
    expect(ticketModal).not.toContain("DateTimePickerField");
    expect(ticketFooter).toContain("export function ItineraryTicketModalFooter");
    expect(ticketSections).toContain("export function TicketModeToggle");
    expect(ticketSections).toContain("export function TicketFieldGrid");
    expect(ticketSections).toContain("export function LinkedActivitiesPicker");
    expect(ticketModel).toContain("export function useItineraryTicketModalModel");
    expect(ticketModel).toContain("buildTicketSubmitInput");
  });

  it("keeps activity time controls split into direct modules", () => {
    const activityCell = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell.tsx"), "utf8");
    const subActivityList = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/SubActivityList.tsx"), "utf8");
    const exports = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/components.tsx"), "utf8");
    const button = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityTimeButton.tsx"), "utf8");
    const modal = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/TimeEditModal.tsx"), "utf8");
    const types = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/time-components.types.ts"), "utf8");

    expect(activityCell).toContain("./activity-cell/ActivityTimeButton");
    expect(activityCell).not.toContain("TimeComponents");
    expect(subActivityList).toContain("./ActivityTimeButton");
    expect(subActivityList).not.toContain("TimeComponents");
    expect(exports).toContain("./activity-cell/ActivityTimeButton");
    expect(exports).toContain("./activity-cell/TimeEditModal");
    expect(exports).not.toContain("TimeComponents");
    expect(button).toContain("export function ActivityTimeButton");
    expect(button).not.toContain("createPortal");
    expect(modal).toContain("export function TimeEditModal");
    expect(types).toContain("export interface ActivityTimeButtonProps");
  });

  it("keeps activity-cell styles split from table-level styles", () => {
    const tableStyles = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table.styles.ts"), "utf8");
    const activityCellStyles = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/activity-cell.styles.ts"), "utf8");

    expect(tableStyles).toContain("./activity-cell/activity-cell.styles");
    expect(tableStyles).not.toContain("const activityCellClassName");
    expect(tableStyles).not.toContain("const timeEditModalClassName");
    expect(tableStyles).not.toContain("const ticketModalClassName");
    expect(activityCellStyles).toContain("export const activityCellClassName");
    expect(activityCellStyles).toContain("export const timeEditModalClassName");
    expect(activityCellStyles).toContain("export const ticketModalClassName");
  });

  it("keeps sub-activity components split into direct modules", () => {
    const activityCell = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell.tsx"), "utf8");
    const exports = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/components.tsx"), "utf8");
    const list = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/SubActivityList.tsx"), "utf8");
    const modal = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/SubActivityModal.tsx"), "utf8");
    const types = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/activity-cell/sub-activity.types.ts"), "utf8");

    expect(activityCell).toContain("./activity-cell/SubActivityList");
    expect(activityCell).toContain("./activity-cell/SubActivityModal");
    expect(activityCell).not.toContain("SubActivityComponents");
    expect(exports).toContain("./activity-cell/SubActivityList");
    expect(exports).toContain("./activity-cell/SubActivityModal");
    expect(exports).not.toContain("SubActivityComponents");
    expect(list).toContain("export function SubActivityList");
    expect(modal).toContain("export function SubActivityModal");
    expect(types).toContain("export interface SubActivitySharedProps");
  });

  it("keeps itinerary table weather formatting split from path utilities", () => {
    const tableUtils = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-utils.ts"), "utf8");
    const weatherSummary = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/weather-summary.ts"), "utf8");
    const weatherChip = readFileSync(join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/day-weather-chip.tsx"), "utf8");

    expect(tableUtils).not.toContain("TripDailyBriefing");
    expect(tableUtils).not.toContain("weather-briefings");
    expect(tableUtils).not.toContain("buildWeatherSummary");
    expect(tableUtils).not.toContain("buildWeatherTooltip");
    expect(weatherSummary).toContain("export function buildWeatherSummary");
    expect(weatherSummary).toContain("export function buildWeatherTooltip");
    expect(weatherChip).toContain("./weather-summary");
  });

  it("keeps weather briefing drawer formatting split from render", () => {
    const drawer = readFileSync(join(frontendRoot, "src/shared/components/weather/WeatherBriefingDrawer.tsx"), "utf8");
    const drawerModel = readFileSync(join(frontendRoot, "src/shared/components/weather/weather-briefing-drawer-model.ts"), "utf8");

    expect(drawer).toContain("./weather-briefing-drawer-model");
    expect(drawer).not.toContain("function formatWeatherSummary");
    expect(drawer).not.toContain("function buildWeatherDetailLines");
    expect(drawer).not.toContain("function weatherDrawerCopy");
    expect(drawerModel).toContain("export function formatWeatherSummary");
    expect(drawerModel).toContain("export function buildWeatherDetailLines");
    expect(drawerModel).toContain("export function weatherDrawerCopy");
  });

  it("keeps StopDialog render split from form model state", () => {
    const stopDialog = readFileSync(join(frontendRoot, "src/features/itinerary/components/stop-dialog/StopDialog.tsx"), "utf8");
    const stopDialogModel = readFileSync(join(frontendRoot, "src/features/itinerary/components/stop-dialog/use-stop-dialog-model.ts"), "utf8");

    expect(stopDialog).toContain("./use-stop-dialog-model");
    expect(stopDialog).not.toContain("useState");
    expect(stopDialog).not.toContain("buildStopSubmitValues");
    expect(stopDialog).not.toContain("applyStopActivityInput");
    expect(stopDialogModel).toContain("export function useStopDialogModel");
    expect(stopDialogModel).toContain("buildStopSubmitValues");
    expect(stopDialogModel).toContain("applyStopActivityInput");
  });

  it("keeps stop dialog detail serialization split from utility ids", () => {
    const stopDialogUtils = readFileSync(join(frontendRoot, "src/features/itinerary/components/stop-dialog/stop-dialog.utils.ts"), "utf8");
    const stopDialogDetails = readFileSync(join(frontendRoot, "src/features/itinerary/components/stop-dialog/stop-dialog-details.ts"), "utf8");

    expect(stopDialogUtils).toContain("./stop-dialog-details");
    expect(stopDialogUtils).toContain("export const stopDialogFieldIds");
    expect(stopDialogUtils).not.toContain("export function buildStructuredStopDetails");
    expect(stopDialogUtils).not.toContain("function trimmedStopDetailValues");
    expect(stopDialogDetails).toContain("export function buildStructuredStopDetails");
    expect(stopDialogDetails).toContain("function trimmedStopDetailValues");
  });

  it("keeps overview role panels split by reusable panel responsibility", () => {
    const managerRolePanels = readFileSync(join(frontendRoot, "src/features/itinerary/components/overview/ManagerOverviewPanels.tsx"), "utf8");
    const travelerRolePanels = readFileSync(join(frontendRoot, "src/features/itinerary/components/overview/TravelerOverviewPanels.tsx"), "utf8");
    const viewerRolePanels = readFileSync(join(frontendRoot, "src/features/itinerary/components/overview/ViewerOverviewPanels.tsx"), "utf8");
    const managerChecklist = readFileSync(join(frontendRoot, "src/features/itinerary/components/overview/ManagerChecklistPanel.tsx"), "utf8");
    const snapshotPanels = readFileSync(join(frontendRoot, "src/features/itinerary/components/overview/OverviewSnapshotPanels.tsx"), "utf8");
    const rolePanelTypes = readFileSync(join(frontendRoot, "src/features/itinerary/components/overview/overview-role-panels.types.ts"), "utf8");

    expect(managerRolePanels).toContain("./ManagerChecklistPanel");
    expect(managerRolePanels).toContain("./overview-role-panels.types");
    expect(travelerRolePanels).toContain("./TravelerChecklistPanel");
    expect(travelerRolePanels).toContain("./OverviewSnapshotPanels");
    expect(viewerRolePanels).toContain("./OverviewSnapshotPanels");
    expect(managerRolePanels).not.toContain("SegmentedControl");
    expect(travelerRolePanels).not.toContain("interface TravelerOverviewPanelsProps");
    expect(viewerRolePanels).not.toContain("interface ViewerOverviewPanelsProps");
    expect(managerChecklist).toContain("export function ManagerTaskChecklistPanel");
    expect(snapshotPanels).toContain("export function OverviewHighlightsPanel");
    expect(rolePanelTypes).toContain("export interface ManagerOverviewPanelsProps");
  });

  it("keeps overview cockpit cards split from shared overview sections", () => {
    const overviewSections = readFileSync(join(frontendRoot, "src/features/itinerary/components/overview/OverviewSections.tsx"), "utf8");
    const cockpit = readFileSync(join(frontendRoot, "src/features/itinerary/components/overview/OverviewCockpit.tsx"), "utf8");
    const cockpitCard = readFileSync(join(frontendRoot, "src/features/itinerary/components/overview/OverviewCockpitCard.tsx"), "utf8");
    const overviewBarrel = readFileSync(join(frontendRoot, "src/features/itinerary/components/overview/index.ts"), "utf8");

    expect(cockpit).toContain("./OverviewCockpitCard");
    expect(overviewBarrel).toContain('export { CockpitCard } from "./OverviewCockpitCard"');
    expect(overviewSections).not.toContain("export function CockpitCard");
    expect(overviewSections).not.toContain("cockpitCardButtonClassName");
    expect(cockpitCard).toContain("export function CockpitCard");
    expect(cockpitCard).toContain("cockpitCardButtonClassName");
  });

  it("keeps overview task state split from page composition", () => {
    const overviewPage = readFileSync(join(frontendRoot, "src/features/itinerary/components/overview/OverviewPage.tsx"), "utf8");
    const overviewTaskState = readFileSync(join(frontendRoot, "src/features/itinerary/components/overview/use-overview-task-state.ts"), "utf8");

    expect(overviewPage).toContain("./use-overview-task-state");
    expect(overviewPage).not.toContain("useState");
    expect(overviewPage).not.toContain("useMemo");
    expect(overviewPage).not.toContain("function submitTask");
    expect(overviewPage).not.toContain("isMyTask");
    expect(overviewTaskState).toContain("export function useOverviewTaskState");
    expect(overviewTaskState).toContain("function submitTask");
    expect(overviewTaskState).toContain("isMyTask");
    expect(overviewTaskState).toContain("myOpenTasks");
    expect(overviewTaskState).toContain("sharedOpenTasks");
  });

  it("keeps expenses page state split from page composition", () => {
    const expensesPage = readFileSync(join(frontendRoot, "src/features/workspace/pages/expenses/TripExpensesPage.tsx"), "utf8");
    const expensesState = readFileSync(join(frontendRoot, "src/features/workspace/pages/expenses/use-trip-expenses-page-state.ts"), "utf8");
    const expenseDialog = readFileSync(join(frontendRoot, "src/features/workspace/pages/expenses/ExpenseDialog.tsx"), "utf8");
    const expenseDialogState = readFileSync(join(frontendRoot, "src/features/workspace/pages/expenses/hooks/useExpenseDialogState.ts"), "utf8");

    expect(expensesPage).toContain("./use-trip-expenses-page-state");
    expect(expensesPage).not.toContain("useState");
    expect(expensesPage).not.toContain("useMemo");
    expect(expensesPage).not.toContain("buildExpenseCsv");
    expect(expensesPage).not.toContain("refundSplits");
    expect(expensesPage).not.toContain("function recordRefund");
    expect(expensesState).toContain("export function useTripExpensesPageState");
    expect(expensesState).toContain("buildExpenseCsv");
    expect(expensesState).toContain("refundSplits");
    expect(expensesState).toContain("function recordRefund");
    expect(expenseDialog).toContain("./hooks/useExpenseDialogState");
    expect(expenseDialog).not.toContain("useState");
    expect(expenseDialog).not.toContain("calculateExpenseDialogState");
    expect(expenseDialog).not.toContain("function submitExpense");
    expect(expenseDialogState).toContain("export function useExpenseDialogState");
    expect(expenseDialogState).toContain("useExpenseSplitEditor");
    expect(expenseDialogState).toContain("function submitExpense");
  });

});
