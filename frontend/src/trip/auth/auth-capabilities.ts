import type { TripCapability, TripRole } from "../types";

const roleCapabilities: Record<TripRole, TripCapability[]> = {
  owner: ["viewPlan", "editItinerary", "reviewSuggestions", "createSuggestion", "viewExpenses", "createExpense", "editExpenses", "managePeople", "manageTripPlans", "managePhotoAlbums"],
  organizer: ["viewPlan", "editItinerary", "reviewSuggestions", "createSuggestion", "viewExpenses", "createExpense", "editExpenses", "managePeople", "manageTripPlans", "managePhotoAlbums"],
  traveler: ["viewPlan", "editItinerary", "createSuggestion", "viewExpenses", "createExpense", "managePhotoAlbums"],
  viewer: ["viewPlan"],
};

export function canTripRole(role: TripRole, capability: TripCapability): boolean {
  return roleCapabilities[role].includes(capability);
}
