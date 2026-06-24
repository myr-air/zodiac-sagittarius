import type {
  AccountExplorerSummary,
  AccountSession,
  AccountTodoSummary,
  AccountTripCreateRequest,
  AccountTripCreateResponse,
  AccountVaultItemSummary,
  OwnerTransferResponse,
  PasskeyChallengeResponse,
  PasskeyLoginStartResponse,
  PasskeySummary,
} from "@/src/account/api-client";
import type { TripParticipantSession } from "@/src/trip/types";
import { accountTrip } from "./account-access-panel-base-fixtures";

export function createTrustedAccountSession(overrides: Partial<AccountSession> = {}): AccountSession {
  return {
    userId: "user-aom",
    sessionToken: "account-session",
    kind: "trusted",
    trustedDeviceId: "device-current",
    createdAt: "2026-05-30T08:00:00.000Z",
    expiresAt: "2026-06-29T08:00:00.000Z",
    ...overrides,
  };
}

export const accountExplorerSummary: AccountExplorerSummary = {
  upcomingTrips: 1,
  ownedTrips: 1,
  destinationCount: 2,
  nextTrip: accountTrip,
};

export const accountTodo: AccountTodoSummary = {
  id: "todo-1",
  tripId: "trip-id",
  tripName: "Seoul Spring",
  title: "Book train",
  status: "open",
  visibility: "shared",
  kind: "booking",
  assigneeId: null,
  relatedItemId: null,
  version: 1,
};

export const accountTodos: AccountTodoSummary[] = [accountTodo];

export const accountVaultItem: AccountVaultItemSummary = {
  id: "vault-1",
  tripId: "trip-id",
  tripName: "Seoul Spring",
  kind: "note",
  title: "Passport note",
  detail: "Keep copies ready",
  externalUrl: null,
  source: "vault",
  createdAt: "2026-05-30T08:00:00.000Z",
};

export const accountVaultItems: AccountVaultItemSummary[] = [accountVaultItem];

export const createdAccountVaultItem: AccountVaultItemSummary = {
  id: "vault-created",
  tripId: null,
  tripName: null,
  kind: "file",
  title: "Tickets",
  detail: "PDF link",
  externalUrl: "https://example.test/tickets.pdf",
  source: "vault",
  createdAt: "2026-05-30T08:00:00.000Z",
};

export function createAccountTripCreateResponse(
  request: AccountTripCreateRequest,
): AccountTripCreateResponse {
  return {
    trip: {
      id: "trip-created",
      name: request.name,
      destinationLabel: request.destinationLabel,
      startDate: request.startDate,
      endDate: request.endDate,
      joinId: request.joinId,
      activePlanVariantId: "plan-main",
      ownerMemberId: "member-owner",
      version: 1,
    },
    ownerMemberId: "member-owner",
    memberSession: accountCreatedMemberSession,
  };
}

export const accountCreatedMemberSession: TripParticipantSession = {
  tripId: "trip-created",
  memberId: "member-owner",
  sessionToken: "member-session",
  createdAt: "2026-05-30T08:00:00.000Z",
  expiresAt: "2026-06-29T08:00:00.000Z",
};

export const accountExistingMemberSession: TripParticipantSession = {
  ...accountCreatedMemberSession,
  tripId: "trip-id",
};

export const accountOwnerTransfer: OwnerTransferResponse = {
  tripId: "trip-id",
  previousOwnerMemberId: "member-owner",
  newOwnerMemberId: "member-target",
};

export const accountPasskeyRegistrationChallenge: PasskeyChallengeResponse = {
  challengeId: "passkey-challenge",
  challenge: "AQIDBA",
  expiresAt: "2026-05-30T09:00:00.000Z",
};

export const accountPasskeyLoginChallenge: PasskeyLoginStartResponse = {
  challengeId: "passkey-login-challenge",
  challenge: "AQIDBA",
  expiresAt: "2026-05-30T09:00:00.000Z",
  allowCredentials: [{ credentialId: "BQYH" }],
};

export const accountPasskey: PasskeySummary = {
  id: "passkey-id",
  nickname: "Aom passkey",
  createdAt: "2026-05-30T08:00:00.000Z",
  lastUsedAt: null,
};
