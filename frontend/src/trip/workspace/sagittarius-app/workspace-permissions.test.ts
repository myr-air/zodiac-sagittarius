import { describe, expect, it } from "vitest";
import { deriveWorkspacePermissions } from "./workspace-permissions";

describe("deriveWorkspacePermissions", () => {
  it("keeps owner workspace permissions aligned with domain capabilities", () => {
    expect(deriveWorkspacePermissions("owner")).toMatchObject({
      canCreateStopNote: true,
      canCreateSuggestion: true,
      canEdit: true,
      canEditBookings: true,
      canEditExpenses: true,
      canEditPhotoAlbums: true,
      canManagePeople: true,
      canManageTripPlans: true,
      canReviewSuggestions: true,
      canViewExpenses: true,
    });
  });

  it("derives booking and stop-note permissions from itinerary and expense capabilities", () => {
    expect(deriveWorkspacePermissions("traveler")).toMatchObject({
      canCreateStopNote: true,
      canCreateSuggestion: true,
      canEdit: true,
      canEditBookings: true,
      canEditExpenses: false,
      canManagePeople: false,
      canManageTripPlans: false,
    });
  });

  it("keeps viewer access read-only for workspace mutation surfaces", () => {
    expect(deriveWorkspacePermissions("viewer")).toMatchObject({
      canCreateStopNote: false,
      canCreateSuggestion: false,
      canEdit: false,
      canEditBookings: false,
      canEditExpenses: false,
      canEditPhotoAlbums: false,
      canManagePeople: false,
      canManageTripPlans: false,
      canReviewSuggestions: false,
      canViewExpenses: false,
    });
  });
});
