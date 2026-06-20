import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot } from "./project-contract.helpers";
import { expectSourceNotToContain } from "./workspace-source-boundaries.assertions";
import { sagittariusAppBlockedBoundaryTerms } from "./workspace-source-boundaries.blocked-terms";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace source boundaries", () => {
  it("keeps workspace orchestration split by responsibility", () => {
    const {
      sagaCore,
      workspaceContextsHook,
      sagittariusAccessGate,
      workspaceAppFrame,
      workspaceMainShell,
      workspaceAccessProps,
      workspaceShellProps,
      workspaceDialogsProps,
      workspaceRailProps,
      workspaceToastProps,
      workspaceCoreCommandProps,
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
    expect(workspaceCoreCommandProps).toContain("onSaveTripSettings");
    expect(workspaceCoreCommandProps).toContain("toggleTaskStatus");
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
    expect(workspaceShellProps).toContain("export function buildWorkspaceShellProps");
    expect(workspaceShellProps).toContain("dialogsProps:");
    expect(workspaceShellProps).toContain("toastProps:");
    expect(workspaceShellProps).toContain("../WorkspaceAppFrame");
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
    expect(workspaceCoreFrameProps).toContain("export function buildWorkspaceCoreFrameProps");
    expect(sagittariusApp).not.toContain("onAddNoteForItem: (itemId, body)");
    expect(sagittariusApp).not.toContain("onAddStop:");
    expect(sagittariusApp).not.toContain("onSaveDayTitle: (date, version, title)");
    expect(sagittariusApp).not.toContain("canClaimMember: Boolean(");
    expect(workspaceFrameActionProps).toContain(
      "export function buildWorkspaceFrameActionProps",
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
    expect(workspaceAppFrame).not.toContain("useWorkspaceApiClients");
    expectSourceNotToContain(sagittariusApp, sagittariusAppBlockedBoundaryTerms);
    expect(sagaCore).toContain("WorkspaceAppFrame");
    expect(sagaCore).not.toContain("WorkspaceMainShell");
    expect(workspaceAppFrame).toContain("WorkspaceMainShell");
    expect(sagaCore).not.toContain("@/src/trip/workspace/TripWorkspaceFrame");
    expect(sagaCore).not.toContain("@/src/trip/workspace/TripWorkspaceRail");
    expect(sagaCore).not.toContain("@/src/trip/workspace/TripWorkspaceViews");
    expect(workspaceMainShell).toContain("export function WorkspaceMainShell");
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
  });

  it("keeps workspace dialog chrome styles shared", () => {
    const importDialog = readFileSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceImportDialog.tsx"), "utf8");
    const deleteDialog = readFileSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceDeleteDialog.tsx"), "utf8");
    const dialogStyles = readFileSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceDialog.styles.ts"), "utf8");

    expect(importDialog).toContain("./TripWorkspaceDialog.styles");
    expect(deleteDialog).toContain("./TripWorkspaceDialog.styles");
    expect(importDialog).not.toContain("const importModalBackdropClassName");
    expect(deleteDialog).not.toContain("const deleteModalBackdropClassName");
    expect(dialogStyles).toContain("export const workspaceDialogBackdropClassName");
    expect(dialogStyles).toContain("export const workspaceDialogActionsClassName");
  });
});
