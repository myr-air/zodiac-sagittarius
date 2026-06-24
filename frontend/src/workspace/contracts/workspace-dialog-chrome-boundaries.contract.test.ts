import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";

describe("workspace dialog chrome source boundaries", () => {
  it("keeps workspace dialog chrome styles shared", () => {
    const importDialog = readFileSync(
      join(frontendRoot, "src/trip/workspace/TripWorkspaceImportDialog.tsx"),
      "utf8",
    );
    const importDialogActions = readFileSync(
      join(frontendRoot, "src/trip/workspace/use-trip-workspace-import-dialog-actions.ts"),
      "utf8",
    );
    const importDialogState = readFileSync(
      join(frontendRoot, "src/trip/workspace/trip-workspace-import-dialog-state.ts"),
      "utf8",
    );
    const deleteDialog = readFileSync(
      join(frontendRoot, "src/trip/workspace/TripWorkspaceDeleteDialog.tsx"),
      "utf8",
    );
    const dialogStyles = readFileSync(
      join(frontendRoot, "src/trip/workspace/TripWorkspaceDialog.styles.ts"),
      "utf8",
    );

    expect(importDialog).toContain("WorkspaceCompactFormDialog");
    expect(importDialog).toContain("./TripWorkspaceDialog.styles");
    expect(importDialog).toContain("./trip-workspace-import-dialog-state");
    expect(importDialog).toContain("./use-trip-workspace-import-dialog-actions");
    expect(importDialog).not.toContain("useState");
    expect(importDialog).not.toContain("function submitImport");
    expect(importDialog).not.toContain("buildItineraryImportApplyTarget");
    expect(importDialogActions).toContain("export function useTripWorkspaceImportDialogActions");
    expect(importDialogActions).toContain("function submitImport");
    expect(importDialogActions).toContain("buildTripWorkspaceImportApplyTarget");
    expect(importDialogState).toContain("export function useTripWorkspaceImportDialogState");
    expect(importDialogState).toContain("initialTripWorkspaceImportDialogState");
    expect(importDialogState).toContain("export function buildTripWorkspaceImportApplyTarget");
    expect(importDialogState).toContain("@/src/shared/form-state");
    expect(deleteDialog).toContain("WorkspaceConfirmDialog");
    expect(importDialog).not.toContain("workspaceDialogBackdropClassName");
    expect(importDialog).not.toContain("importDialogTitleClassName");
    expect(importDialog).not.toContain("workspaceDialogActionsClassName");
    expect(importDialog).not.toContain("const importModalBackdropClassName");
    expect(deleteDialog).not.toContain("const deleteModalBackdropClassName");
    expect(deleteDialog).not.toContain("deleteDialogClassName");
    expect(dialogStyles).not.toContain("export const workspaceDialogBackdropClassName");
    expect(dialogStyles).not.toContain("export const workspaceDialogActionsClassName");
  });
});
