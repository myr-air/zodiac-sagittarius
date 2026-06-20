export type TripRole = "owner" | "organizer" | "traveler" | "viewer";
export type TripMemberAccessStatus = "active" | "disabled";

export type TripCapability =
  | "viewPlan"
  | "editItinerary"
  | "reviewSuggestions"
  | "createSuggestion"
  | "viewExpenses"
  | "editExpenses"
  | "managePeople"
  | "manageTripPlans"
  | "managePhotoAlbums";

export interface Member {
  id: string;
  displayName: string;
  role: TripRole;
  presence: "online" | "away" | "offline";
  color: string;
  userId?: string | null;
  claimPasswordHash?: string | null;
  claimedAt?: string | null;
  lastSeenAt?: string | null;
  accessStatus?: TripMemberAccessStatus;
}

export interface TripJoinCredential {
  joinId: string;
  password: string;
}

export interface TripParticipantSession {
  tripId: string;
  memberId: string;
  sessionToken: string;
  createdAt: string;
  expiresAt: string;
}
