import { canTripRole } from "@/src/trip/auth";
import type { TripRole } from "@/src/trip/types";

export interface WorkspacePermissions {
  canCreateStopNote: boolean;
  canCreateExpenses: boolean;
  canCreateSuggestion: boolean;
  canEdit: boolean;
  canEditBookings: boolean;
  canEditExpenses: boolean;
  canEditPhotoAlbums: boolean;
  canManagePeople: boolean;
  canManageTripPlans: boolean;
  canReviewSuggestions: boolean;
  canViewExpenses: boolean;
}

export function deriveWorkspacePermissions(role: TripRole): WorkspacePermissions {
  const canEdit = canTripRole(role, "editItinerary");
  const canCreateExpenses = canTripRole(role, "createExpense");
  const canCreateSuggestion = canTripRole(role, "createSuggestion");
  const canEditExpenses = canTripRole(role, "editExpenses");

  return {
    canCreateStopNote: canCreateSuggestion || canEdit,
    canCreateExpenses,
    canCreateSuggestion,
    canEdit,
    canEditBookings: canEdit || canEditExpenses,
    canEditExpenses,
    canEditPhotoAlbums: canTripRole(role, "managePhotoAlbums"),
    canManagePeople: canTripRole(role, "managePeople"),
    canManageTripPlans: canTripRole(role, "manageTripPlans"),
    canReviewSuggestions: canTripRole(role, "reviewSuggestions"),
    canViewExpenses: canTripRole(role, "viewExpenses"),
  };
}
