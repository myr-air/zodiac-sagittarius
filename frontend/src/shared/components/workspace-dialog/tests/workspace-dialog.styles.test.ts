import { describe, expect, it } from "vitest";
import {
  workspaceDeleteDialogClassName,
  workspaceDialogActionsClassName,
  workspaceDialogBackdropClassName,
  workspaceDialogFormClassName,
  workspaceDialogGridClassName,
  workspaceDialogHeaderClassName,
  workspaceDialogPanelClassName,
  workspacePaddedDialogBackdropClassName,
} from "../workspace-dialog.styles";

describe("workspace dialog styles", () => {
  it("keeps modal shell layout classes centralized", () => {
    expect(workspaceDialogBackdropClassName).toContain("modal-backdrop");
    expect(workspaceDialogBackdropClassName).toContain("fixed inset-0");
    expect(workspaceDialogPanelClassName).toContain("grid-rows-[auto_minmax(0,1fr)]");
    expect(workspaceDialogHeaderClassName).toContain("[&_h2]:font-extrabold");
    expect(workspaceDialogFormClassName).toContain("overflow-y-auto");
    expect(workspaceDialogGridClassName).toContain("max-[767px]:grid-cols-1");
    expect(workspaceDialogActionsClassName).toContain("justify-end");
    expect(workspaceDeleteDialogClassName).toContain("delete-confirm-dialog");
  });

  it("keeps padded modal backdrops available for compact dialogs", () => {
    expect(workspacePaddedDialogBackdropClassName).toContain("modal-backdrop");
    expect(workspacePaddedDialogBackdropClassName).toContain("p-5");
  });
});
