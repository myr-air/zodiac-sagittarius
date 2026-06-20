import type { TripCapability, TripRole } from "./types";

const roleCapabilities: Record<TripRole, TripCapability[]> = {
  owner: ["viewPlan", "editItinerary", "reviewSuggestions", "createSuggestion", "viewExpenses", "editExpenses", "managePeople", "manageTripPlans", "managePhotoAlbums"],
  organizer: ["viewPlan", "editItinerary", "reviewSuggestions", "createSuggestion", "viewExpenses", "editExpenses", "managePeople", "manageTripPlans", "managePhotoAlbums"],
  traveler: ["viewPlan", "editItinerary", "createSuggestion", "viewExpenses", "managePhotoAlbums"],
  viewer: ["viewPlan"],
};

export function canTripRole(role: TripRole, capability: TripCapability): boolean {
  return roleCapabilities[role].includes(capability);
}
