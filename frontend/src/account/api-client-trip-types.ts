import type { TripCity, TripParticipantSession, TripRole } from "@/src/trip/types";
import type { TripSummaryResponse } from "@/src/trip/api-client";

export interface AccountTripSummary {
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
  role: TripRole;
  memberId: string;
  ownerMemberId: string;
  joinedAt: string;
  isOwner: boolean;
}

export interface AccountTripCreateRequest {
  name: string;
  originLabel: string;
  originCity: string;
  originCountry: string;
  originCountryCode: string;
  destinationLabel: string;
  destinationCities: TripCity[];
  countries: string[];
  partySize?: number;
  defaultTimezone?: string;
  startDate: string;
  endDate: string;
  ownerDisplayName: string;
  joinId: string;
  joinPassword: string;
}

export interface AccountTripCreateResponse {
  trip: TripSummaryResponse;
  ownerMemberId: string;
  memberSession: TripParticipantSession;
}

export interface OwnerTransferResponse {
  tripId: string;
  previousOwnerMemberId: string;
  newOwnerMemberId: string;
}
