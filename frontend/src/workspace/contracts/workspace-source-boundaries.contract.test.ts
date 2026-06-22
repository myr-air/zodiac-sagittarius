import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { expectSourceNotToContain } from "./workspace-source-boundaries.assertions";
import { sagittariusAppBlockedBoundaryTerms } from "./workspace-source-boundaries.blocked-terms";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace source boundaries", () => {
  it("keeps workspace orchestration split by responsibility", () => {
    const {
      sagaCore,
      workspaceContextsHook,
      workspaceContextsInputs,
      sagittariusAccessGate,
      workspaceAppFrame,
      workspaceMainShell,
      tripWorkspaceFrame,
      tripWorkspaceRail,
      workspaceRolePreview,
      workspaceToast,
      workspaceAccessProps,
      workspaceShellProps,
      workspaceDialogsProps,
      workspaceRailProps,
      workspaceToastProps,
      workspaceCoreCommandProps,
      workspaceCoreCommandPropsTypes,
      workspaceCoreAppCommandProps,
      workspaceCorePlanningCommandProps,
      workspaceCoreSetupCommandProps,
      workspaceCoreFrameProps,
      workspaceCoreRecordProps,
      workspaceFrameActionProps,
      workspaceFrameProps,
      workspacePageViewProps,
      workspacePlanningViewProps,
      workspaceViewProps,
      workspaceViewPropsTypes,
      workspaceFacade,
      appFacade,
      workspaceDialogs,
      appShellStorySupport,
    } = readWorkspaceBoundarySources(frontendRoot);
    expect(workspaceFacade).toContain("./sagittarius-app");
    expect(appFacade).toContain("@/src/trip/workspace/sagittarius-app");
    expect(appFacade).not.toContain('"use client"');
    const sagittariusApp = sagaCore;
    expect(sagittariusApp).toContain("./WorkspaceAppFrame");
    expect(sagittariusApp).toContain("useSagittariusWorkspaceContexts");
    expect(workspaceContextsHook).toContain("useWorkspaceSetupContext");
    expect(workspaceContextsHook).toContain("useWorkspacePlanningContext");
    expect(workspaceContextsHook).toContain("useWorkspaceCommands");
    expect(workspaceContextsHook).toContain("buildWorkspacePlanningContextParams");
    expect(workspaceContextsHook).toContain("buildWorkspaceCommandsParams");
    expect(workspaceContextsHook).not.toContain("nextClientMutationId");
    expect(workspaceContextsInputs).toContain("nextClientMutationId");
    expect(workspaceContextsInputs).toContain("buildWorkspacePlanningContextParams");
    expect(workspaceContextsInputs).toContain("buildWorkspaceCommandsParams");
    expect(workspaceContextsHook).not.toContain("WorkspaceAppFrame");
    expect(sagittariusApp).not.toContain("./access-gate");
    expect(sagittariusApp).not.toContain("./WorkspaceMainShell");
    expect(sagittariusApp).toContain("./props");
    expect(sagittariusApp).toContain("buildWorkspaceCoreFrameProps");
    expect(sagittariusApp).not.toContain("buildWorkspaceFrameProps");
    expect(workspaceCoreFrameProps).toContain("buildWorkspaceFrameProps");
    expect(workspaceCoreFrameProps).toContain("buildWorkspaceCoreCommandProps");
    expect(workspaceCoreFrameProps).toContain("buildWorkspaceCoreRecordProps");
    expect(workspaceCoreCommandProps).toContain(
      "export function buildWorkspaceCoreCommandProps",
    );
    expect(workspaceCoreCommandProps).toContain("buildWorkspaceCoreAppCommandProps");
    expect(workspaceCoreCommandProps).toContain("buildWorkspaceCorePlanningCommandProps");
    expect(workspaceCoreCommandProps).toContain("buildWorkspaceCoreSetupCommandProps");
    expect(workspaceCoreCommandProps).not.toContain("onSaveTripSettings:");
    expect(workspaceCoreCommandProps).not.toContain("toggleTaskStatus:");
    expect(workspaceCoreCommandPropsTypes).toContain("export type WorkspaceCoreCommandProps");
    expect(workspaceCoreCommandPropsTypes).toContain("WorkspaceCoreSetupCommandProps");
    expect(workspaceCoreCommandPropsTypes).toContain("WorkspaceCorePlanningCommandProps");
    expect(workspaceCoreCommandPropsTypes).toContain("WorkspaceCoreAppCommandProps");
    expect(workspaceCoreAppCommandProps).toContain("export function buildWorkspaceCoreAppCommandProps");
    expect(workspaceCoreAppCommandProps).toContain("onSaveTripSettings");
    expect(workspaceCorePlanningCommandProps).toContain("export function buildWorkspaceCorePlanningCommandProps");
    expect(workspaceCorePlanningCommandProps).toContain("toggleTaskStatus");
    expect(workspaceCoreSetupCommandProps).toContain("export function buildWorkspaceCoreSetupCommandProps");
    expect(workspaceCoreSetupCommandProps).toContain("setContextRailVisibility");
    expect(workspaceCoreRecordProps).toContain(
      "export function buildWorkspaceCoreRecordProps",
    );
    expect(workspaceCoreRecordProps).toContain("scopedTripPlanRecords");
    expect(workspaceCoreRecordProps).toContain("selectedItemIdForView");
    expect(sagittariusApp).not.toContain("buildWorkspaceAccessProps");
    expect(sagittariusApp).not.toContain("buildWorkspaceShellProps");
    expect(sagittariusApp).not.toContain("buildWorkspaceViewsProps");
    expect(sagittariusApp).not.toContain("accessProps={{");
    expect(sagittariusApp).not.toContain("shellProps={{");
    expect(sagittariusApp).not.toContain("dialogsProps:");
    expect(sagittariusApp).not.toContain("toastProps:");
    expect(sagittariusApp).not.toContain("settingsProps:");
    expect(sagittariusApp).not.toContain("timelineProps:");
    expect(workspaceAccessProps).toContain("export function buildWorkspaceAccessProps");
    expect(workspaceAccessProps).toContain("sessionRestored");
    expect(workspaceAccessProps).toContain("../WorkspaceAppFrame");
    expect(workspaceAccessProps).toContain("export type BuildWorkspaceAccessPropsInput");
    expect(workspaceShellProps).toContain("export function buildWorkspaceShellProps");
    expect(workspaceShellProps).toContain("dialogsProps:");
    expect(workspaceShellProps).toContain("toastProps:");
    expect(workspaceShellProps).toContain("../WorkspaceAppFrame");
    expect(workspaceShellProps).not.toContain("ComponentProps<typeof WorkspaceAppFrame>");
    expect(workspaceShellProps).toContain("buildWorkspaceDialogsProps");
    expect(workspaceShellProps).toContain("buildWorkspaceRailProps");
    expect(workspaceShellProps).toContain("buildWorkspaceToastProps");
    expect(workspaceDialogsProps).toContain("export function buildWorkspaceDialogsProps");
    expect(workspaceRailProps).toContain("export function buildWorkspaceRailProps");
    expect(workspaceToastProps).toContain("export function buildWorkspaceToastProps");
    expect(sagittariusApp).not.toContain("buildWorkspaceFrameActionProps");
    expect(workspaceFrameProps).toContain("buildWorkspaceAccessProps");
    expect(workspaceFrameProps).toContain("buildWorkspaceShellProps");
    expect(workspaceFrameProps).toContain("buildWorkspaceViewsProps");
    expect(workspaceFrameProps).toContain("buildWorkspaceFrameActionProps");
    expect(workspaceFrameProps).toContain("export function buildWorkspaceFrameProps");
    expect(workspaceFrameProps).not.toContain("ComponentProps<typeof WorkspaceAppFrame>");
    expect(workspaceCoreFrameProps).toContain("export function buildWorkspaceCoreFrameProps");
    expect(sagittariusApp).not.toContain("onAddNoteForItem: (itemId, body)");
    expect(sagittariusApp).not.toContain("onAddStop:");
    expect(sagittariusApp).not.toContain("onSaveDayTitle: (date, version, title)");
    expect(sagittariusApp).not.toContain("canClaimMember: Boolean(");
    expect(workspaceFrameActionProps).toContain(
      "export function buildWorkspaceFrameActionProps",
    );
    expect(workspaceFrameActionProps).toContain(
      "export interface BuildWorkspaceFrameActionPropsInput",
    );
    expect(workspaceFrameActionProps).toContain("onSaveDayTitle:");
    expect(workspaceFrameActionProps).toContain("canClaimMember:");
    expect(workspaceViewProps).toContain("export function buildWorkspaceViewsProps");
    expect(workspaceViewProps).toContain("buildWorkspacePageViewProps");
    expect(workspaceViewProps).toContain("buildWorkspacePlanningViewProps");
    expect(workspaceViewProps).not.toContain("settingsProps:");
    expect(workspaceViewProps).not.toContain("timelineProps:");
    expect(workspacePageViewProps).toContain("settingsProps:");
    expect(workspacePageViewProps).toContain("expensesProps:");
    expect(workspacePlanningViewProps).toContain("overviewProps:");
    expect(workspacePlanningViewProps).toContain("timelineProps:");
    expect(workspaceViewPropsTypes).toContain("@/src/trip/workspace/TripWorkspaceViews");
    expect(workspaceAppFrame).toContain("WorkspaceAccessBoundary");
    expect(workspaceAppFrame).toContain("WorkspaceMainShell");
    expect(workspaceAppFrame).toContain("export interface WorkspaceAppFrameProps");
    expect(workspaceAppFrame).not.toContain("useWorkspaceApiClients");
    expectSourceNotToContain(sagittariusApp, sagittariusAppBlockedBoundaryTerms);
    expect(sagaCore).toContain("WorkspaceAppFrame");
    expect(sagaCore).not.toContain("WorkspaceMainShell");
    expect(workspaceAppFrame).toContain("WorkspaceMainShell");
    expect(sagaCore).not.toContain("@/src/trip/workspace/TripWorkspaceFrame");
    expect(sagaCore).not.toContain("@/src/trip/workspace/TripWorkspaceRail");
    expect(sagaCore).not.toContain("@/src/trip/workspace/TripWorkspaceViews");
    expect(workspaceMainShell).toContain("export function WorkspaceMainShell");
    expect(workspaceMainShell).not.toContain("ComponentProps<typeof");
    expect(workspaceFrameProps).toContain("export type BuildWorkspaceFramePropsInput");
    expect(workspaceFrameProps).not.toContain("Parameters<typeof buildWorkspace");
    expect(workspaceCoreFrameProps).not.toContain("Parameters<typeof buildWorkspace");
    expect(workspaceCoreCommandProps).not.toContain("Parameters<typeof buildWorkspace");
    expect(workspaceCoreCommandPropsTypes).not.toContain("Parameters<typeof buildWorkspace");
    expect(workspaceCoreRecordProps).not.toContain("Parameters<typeof buildWorkspace");
    expect(tripWorkspaceFrame).toContain("export interface TripWorkspaceFrameProps");
    expect(tripWorkspaceRail).toContain("export interface TripWorkspaceRailProps");
    expect(workspaceDialogs).toContain("export interface WorkspaceDialogsProps");
    expect(workspaceRolePreview).toContain("export interface WorkspaceRolePreviewProps");
    expect(workspaceToast).toContain("export interface WorkspaceToastProps");
    expect(workspaceMainShell).toContain("@/src/trip/workspace/TripWorkspaceFrame");
    expect(workspaceMainShell).toContain("@/src/trip/workspace/TripWorkspaceRail");
    expect(workspaceMainShell).toContain("@/src/trip/workspace/TripWorkspaceViews");
    expect(sagaCore).toContain("WorkspaceAppFrame");
    expect(sagaCore).not.toContain("WorkspaceAccessBoundary");
    expect(workspaceAppFrame).toContain("WorkspaceAccessBoundary");
    expect(sagaCore).not.toContain("TripAccessLoadingFrame");
    expect(sagaCore).not.toContain("TripWorkspaceAccessPanel");
    expect(sagittariusAccessGate).toContain("export function WorkspaceAccessBoundary");
    expect(sagittariusAccessGate).toContain("TripAccessLoadingFrame");
    expect(sagittariusAccessGate).toContain("TripWorkspaceAccessPanel");
    expect(sagaCore).not.toContain("./WorkspaceDialogs");
    expect(workspaceMainShell).toContain("./WorkspaceDialogs");
    expect(workspaceDialogs).toContain("@/src/trip/workspace/TripWorkspaceDeleteDialog");
    expect(workspaceDialogs).toContain("@/src/trip/workspace/TripWorkspaceImportDialog");
    expect(sagaCore).not.toContain('from "@/src/components/ContextRail"');
    expect(sagaCore).not.toContain("workspaceGridClassName");
    expect(sagaCore).not.toContain("planningMainClassName");
    expect(sagaCore).not.toContain("delete-confirm-dialog");
    expect(sagaCore).not.toContain("appDeleteDialogTitleClassName");
    expect(sagaCore).not.toContain("import-options-dialog");
    expect(sagaCore).not.toContain("ItineraryImportOptionsDialog");
    expect(workspaceMainShell).toContain("WorkspaceRolePreview");
    expect(appShellStorySupport).toContain("AppShellProps");
    expect(appShellStorySupport).not.toContain("Parameters<typeof AppShell>");
  });

  it("keeps workspace dialog chrome styles shared", () => {
    const importDialog = readFileSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceImportDialog.tsx"), "utf8");
    const importDialogState = readFileSync(join(frontendRoot, "src/trip/workspace/trip-workspace-import-dialog-state.ts"), "utf8");
    const deleteDialog = readFileSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceDeleteDialog.tsx"), "utf8");
    const dialogStyles = readFileSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceDialog.styles.ts"), "utf8");

    expect(importDialog).toContain("./TripWorkspaceDialog.styles");
    expect(importDialog).toContain("./trip-workspace-import-dialog-state");
    expect(importDialog).not.toContain("useState");
    expect(importDialogState).toContain("export function useTripWorkspaceImportDialogState");
    expect(importDialogState).toContain("initialTripWorkspaceImportDialogState");
    expect(deleteDialog).toContain("./TripWorkspaceDialog.styles");
    expect(importDialog).not.toContain("const importModalBackdropClassName");
    expect(deleteDialog).not.toContain("const deleteModalBackdropClassName");
    expect(dialogStyles).toContain("export const workspaceDialogBackdropClassName");
    expect(dialogStyles).toContain("export const workspaceDialogActionsClassName");
  });

  it("keeps workspace page form dialogs on shared chrome", () => {
    const workspaceDialog = readFileSync(join(frontendRoot, "src/shared/components/workspace-dialog/WorkspaceDialog.tsx"), "utf8");
    const expenseDialog = readFileSync(join(frontendRoot, "src/features/workspace/pages/expenses/ExpenseDialog.tsx"), "utf8");
    const bookingDialog = readFileSync(join(frontendRoot, "src/features/workspace/pages/bookings-docs/components/BookingDialog.tsx"), "utf8");
    const photoDialog = readFileSync(join(frontendRoot, "src/features/workspace/pages/photos/components/PhotoAlbumDialog.tsx"), "utf8");
    const expenseStyles = readFileSync(join(frontendRoot, "src/features/workspace/pages/expenses/TripExpensesPage.styles.ts"), "utf8");
    const bookingStyles = readFileSync(join(frontendRoot, "src/features/workspace/pages/bookings-docs/BookingsDocsPage.styles.ts"), "utf8");
    const photoStyles = readFileSync(join(frontendRoot, "src/features/workspace/pages/photos/TripPhotosPage.styles.ts"), "utf8");

    expect(workspaceDialog).toContain("workspaceDialogBackdropClassName");
    expect(workspaceDialog).toContain("workspaceDialogPanelClassName");
    expect(workspaceDialog).toContain("workspaceDialogHeaderClassName");
    expect(expenseDialog).toContain("WorkspaceDialog");
    expect(bookingDialog).toContain("WorkspaceDialog");
    expect(photoDialog).toContain("WorkspaceDialog");
    expect(expenseDialog).not.toContain("dialogBackdropClassName");
    expect(bookingDialog).not.toContain("dialogBackdropClassName");
    expect(photoDialog).not.toContain("dialogBackdropClassName");
    expect(expenseStyles).not.toContain("workspaceDialogPanelClassName");
    expect(bookingStyles).not.toContain("workspaceDialogPanelClassName");
    expect(photoStyles).not.toContain("workspaceDialogPanelClassName");
  });
});
