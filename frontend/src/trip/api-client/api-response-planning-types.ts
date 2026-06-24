import type {
  Member,
  PlanStatus,
  PlanVariant,
  TripCity,
  TripMemberAccessStatus,
  TripRole,
  TripTask,
} from "../types";

export interface TripSummaryResponse {
  id: string;
  name: string;
  originLabel?: string;
  originCity?: string;
  originCountry?: string;
  originCountryCode?: string;
  destinationLabel: string;
  destinationCities?: TripCity[];
  countries?: string[];
  partySize?: number;
  defaultTimezone?: string;
  startDate: string;
  endDate: string;
  joinId: string;
  activePlanVariantId: string | null;
  mainTripPlanId?: string | null;
  ownerMemberId: string;
  version: number;
}

export interface TripMemberResponse {
  id: string;
  tripId: string;
  displayName: string;
  role: TripRole;
  accessStatus: TripMemberAccessStatus;
  presence: Member["presence"];
  color: string;
  userId: string | null;
  claimedAt: string | null;
  lastSeenAt: string | null;
}

export interface PlanVariantResponse {
  id: string;
  tripId: string;
  name: string;
  kind: PlanVariant["kind"];
  status?: PlanStatus;
  description: string;
  version: number;
}

export interface TripPlanResponse extends PlanVariantResponse {
  status: PlanStatus;
}

export interface TripTaskResponse extends TripTask {
  tripId: string;
  version: number;
}

export interface JoinTripResponse {
  trip: TripSummaryResponse;
  claimableMembers: TripMemberResponse[];
  joinSessionToken: string;
  expiresAt: string;
}
