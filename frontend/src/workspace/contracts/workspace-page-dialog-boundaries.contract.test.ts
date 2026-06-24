import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";

describe("workspace page dialog source boundaries", () => {
  it("keeps workspace page form dialogs on shared chrome", () => {
    const workspaceDialog = readFileSync(
      join(frontendRoot, "src/shared/components/workspace-dialog/WorkspaceDialog.tsx"),
      "utf8",
    );
    const workspaceConfirmDialog = readFileSync(
      join(frontendRoot, "src/shared/components/workspace-dialog/WorkspaceConfirmDialog.tsx"),
      "utf8",
    );
    const expenseDialog = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/expenses/components/ExpenseDialog.tsx"),
      "utf8",
    );
    const bookingDialog = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/bookings-docs/components/BookingDialog.tsx"),
      "utf8",
    );
    const bookingDeleteDialog = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/bookings-docs/components/BookingDeleteDialog.tsx"),
      "utf8",
    );
    const photoDialog = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/photos/components/PhotoAlbumDialog.tsx"),
      "utf8",
    );
    const photoDeleteDialog = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/photos/components/PhotoAlbumDeleteDialog.tsx"),
      "utf8",
    );
    const workspaceDeleteDialog = readFileSync(
      join(frontendRoot, "src/trip/workspace/TripWorkspaceDeleteDialog.tsx"),
      "utf8",
    );
    const expenseStyles = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/expenses/TripExpensesPage.styles.ts"),
      "utf8",
    );
    const bookingStyles = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/bookings-docs/BookingsDocsPage.styles.ts"),
      "utf8",
    );
    const photoStyles = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/photos/TripPhotosPage.styles.ts"),
      "utf8",
    );

    expect(workspaceDialog).toContain("workspaceDialogBackdropClassName");
    expect(workspaceDialog).toContain("workspaceDialogPanelClassName");
    expect(workspaceDialog).toContain("workspaceDialogHeaderClassName");
    expect(workspaceConfirmDialog).toContain("workspaceDeleteDialogClassName");
    expect(expenseDialog).toContain("WorkspaceDialog");
    expect(bookingDialog).toContain("WorkspaceDialog");
    expect(photoDialog).toContain("WorkspaceDialog");
    expect(bookingDeleteDialog).toContain("WorkspaceConfirmDialog");
    expect(photoDeleteDialog).toContain("WorkspaceConfirmDialog");
    expect(workspaceDeleteDialog).toContain("WorkspaceConfirmDialog");
    expect(expenseDialog).not.toContain("dialogBackdropClassName");
    expect(bookingDialog).not.toContain("dialogBackdropClassName");
    expect(photoDialog).not.toContain("dialogBackdropClassName");
    expect(bookingDeleteDialog).not.toContain("dialogBackdropClassName");
    expect(photoDeleteDialog).not.toContain("dialogBackdropClassName");
    expect(workspaceDeleteDialog).not.toContain("workspaceDialogBackdropClassName");
    expect(expenseStyles).not.toContain("workspaceDialogPanelClassName");
    expect(bookingStyles).not.toContain("workspaceDialogPanelClassName");
    expect(photoStyles).not.toContain("workspaceDialogPanelClassName");
    expect(bookingStyles).not.toContain("workspaceDeleteDialogClassName");
    expect(photoStyles).not.toContain("workspaceDeleteDialogClassName");
  });
});
