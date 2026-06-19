import type { TripCity, TripParticipantSession, TripRole } from "@/src/trip/types";
import type { TripSummaryResponse } from "@/src/trip/api-client";

export type AccountSessionKind = "temporary" | "trusted";

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

export interface AccountSession {
  userId: string;
  sessionToken: string;
  kind: AccountSessionKind;
  trustedDeviceId: string | null;
  createdAt: string;
  expiresAt: string;
}

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

export interface EmailLoginStartResponse {
  challengeId: string;
  expiresAt: string;
}

export interface PasskeyChallengeResponse {
  challengeId: string;
  challenge: string;
  expiresAt: string;
}

export interface PasskeyLoginStartResponse extends PasskeyChallengeResponse {
  allowCredentials: Array<{ credentialId: string }>;
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

export interface AccountSettingsUpdateRequest {
  displayName: string;
  avatarColor: string;
  locale: string;
  timezone: string;
  homeCity?: string | null;
  homeCountry?: string | null;
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

export interface AccountApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface AccountApiClient {
  startEmailLogin(email: string): Promise<EmailLoginStartResponse>;
  finishPasswordLogin(input: {
    flow: "login" | "register";
    email: string;
    password: string;
    trustDevice: boolean;
    deviceLabel: string;
  }): Promise<AccountSession>;
  startPasskeyLogin(email: string): Promise<PasskeyLoginStartResponse>;
  finishPasskeyLogin(input: {
    challengeId: string;
    credentialId: string;
    clientDataJson: string;
    authenticatorData: string;
    signature: string;
    trustDevice: boolean;
    deviceLabel: string;
  }): Promise<AccountSession>;
  finishEmailLogin(input: {
    challengeId: string;
    code: string;
    trustDevice: boolean;
    deviceLabel: string;
  }): Promise<AccountSession>;
  loadSettings(sessionToken: string): Promise<AccountSettings>;
  updateSettings(sessionToken: string, request: AccountSettingsUpdateRequest): Promise<AccountSettings>;
  listTrips(sessionToken: string): Promise<AccountTripSummary[]>;
  loadStats(sessionToken: string): Promise<AccountTripStats>;
  loadExplorer(sessionToken: string): Promise<AccountExplorerSummary>;
  listToDos(sessionToken: string): Promise<AccountTodoSummary[]>;
  listVault(sessionToken: string): Promise<AccountVaultItemSummary[]>;
  createVaultItem(sessionToken: string, request: AccountVaultItemCreateRequest): Promise<AccountVaultItemSummary>;
  createTrip(sessionToken: string, request: AccountTripCreateRequest): Promise<AccountTripCreateResponse>;
  createTripMemberSession(sessionToken: string, tripId: string): Promise<TripParticipantSession>;
  claimMember(sessionToken: string, tripId: string, memberId: string, memberSessionToken: string): Promise<void>;
  transferOwner(sessionToken: string, tripId: string, targetMemberId: string): Promise<OwnerTransferResponse>;
  startPasskeyRegistration(sessionToken: string): Promise<PasskeyChallengeResponse>;
  finishPasskeyRegistration(sessionToken: string, input: {
    challengeId: string;
    credentialId: string;
    clientDataJson: string;
    attestationObject: string;
    nickname: string;
  }): Promise<PasskeySummary>;
  revokeTrustedDevice(sessionToken: string, trustedDeviceId: string): Promise<void>;
  logout(sessionToken: string): Promise<void>;
}
