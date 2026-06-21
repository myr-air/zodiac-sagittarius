export const tripRoleValues = ["owner", "organizer", "traveler", "viewer"] as const;
export type TripRole = (typeof tripRoleValues)[number];

export const tripInvitableRoleValues = [
  "organizer",
  "traveler",
  "viewer",
] as const satisfies readonly Exclude<TripRole, "owner">[];
export type TripInvitableRole = (typeof tripInvitableRoleValues)[number];

export const tripMemberAccessStatusValues = ["active", "disabled"] as const;
export type TripMemberAccessStatus = (typeof tripMemberAccessStatusValues)[number];

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
