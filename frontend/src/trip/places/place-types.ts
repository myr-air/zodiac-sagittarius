import type { ItineraryCoordinates } from "../itinerary-core";

export interface TripCity {
  city: string;
  country: string;
  countryCode: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export const placeResolutionStatusValues = [
  "resolved",
  "ambiguous",
  "unresolved",
] as const;
export type PlaceResolutionStatus = (typeof placeResolutionStatusValues)[number];

export interface MapCoordinateResolutionResult {
  attempted: number;
  failed: number;
  resolved: number;
  skipped: number;
}

export interface PlaceResolutionCandidate {
  name: string;
  address: string;
  coordinates: ItineraryCoordinates;
  mapLink: string;
  confidence: number;
  source: string;
  evidence: string[];
}

export interface PlaceResolutionRequest {
  clientMutationId: string;
  activity: string;
  placeHint: string;
  destinationLabel: string;
  countries: string[];
  day: string;
}

export interface PlaceResolutionResponse {
  status: PlaceResolutionStatus;
  candidates: PlaceResolutionCandidate[];
}
