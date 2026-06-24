import type { AccountTripSummary } from "./api-client-trip-types";

export interface AccountProfile {
  id: string;
  displayName: string;
  avatarColor: string;
  locale: string;
  timezone: string;
  homeCity?: string | null;
  homeCountry?: string | null;
  primaryEmail: string | null;
}

export interface AccountTripStats {
  tripsTotal: number;
  tripsOwned: number;
  activeTrips: number;
  tempClaimsCompleted: number;
}

export interface AccountExplorerSummary {
  upcomingTrips: number;
  ownedTrips: number;
  destinationCount: number;
  nextTrip: AccountTripSummary | null;
}

export interface AccountTodoSummary {
  id: string;
  tripId: string;
  tripName: string;
  title: string;
  status: "open" | "done";
  visibility: "private" | "shared";
  kind: string | null;
  assigneeId: string | null;
  relatedItemId: string | null;
  version: number;
}

export interface AccountVaultItemSummary {
  id: string;
  tripId: string | null;
  tripName: string | null;
  kind: "note" | "file";
  title: string;
  detail: string;
  externalUrl: string | null;
  source: "vault" | "itinerary";
  createdAt: string;
}

export interface AccountVaultItemCreateRequest {
  tripId?: string | null;
  kind: "note" | "file";
  title: string;
  detail: string;
  externalUrl?: string | null;
}

export interface PasskeySummary {
  id: string;
  nickname: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface TrustedDeviceSummary {
  id: string;
  label: string;
  userAgent: string;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface AccountSettings {
  profile: AccountProfile;
  passkeys: PasskeySummary[];
  trustedDevices: TrustedDeviceSummary[];
}

export interface AccountSettingsUpdateRequest {
  displayName: string;
  avatarColor: string;
  locale: string;
  timezone: string;
  homeCity?: string | null;
  homeCountry?: string | null;
}
