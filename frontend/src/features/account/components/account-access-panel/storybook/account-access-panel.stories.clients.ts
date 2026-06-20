import type {
  AccountApiClient,
  AccountSettingsUpdateRequest,
  AccountTripCreateRequest,
} from "@/src/account/api-client";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  accountSettings,
  accountStats,
  accountTravelerTrip,
  accountTrip,
} from "../account-access-panel-fixtures";

export const trustedStorySession = {
  userId: "user-aom",
  sessionToken: "account-session",
  kind: "trusted" as const,
  trustedDeviceId: "device-current",
  createdAt: "2026-05-30T08:00:00.000Z",
  expiresAt: "2026-06-29T08:00:00.000Z",
};

export const accountStoryClient: AccountApiClient = {
  startEmailLogin: async () => ({
    challengeId: "login-challenge",
    expiresAt: "2026-05-30T09:00:00.000Z",
  }),
  finishEmailLogin: async () => trustedStorySession,
  finishPasswordLogin: async () => trustedStorySession,
  loadSettings: async () => accountSettings,
  updateSettings: async (
    _sessionToken: string,
    request: AccountSettingsUpdateRequest,
  ) => ({
    ...accountSettings,
    profile: { ...accountSettings.profile, ...request },
  }),
  listTrips: async () => [accountTrip, accountTravelerTrip],
  loadStats: async () => accountStats,
  loadExplorer: async () => ({
    upcomingTrips: 1,
    ownedTrips: 1,
    destinationCount: 2,
    nextTrip: accountTrip,
  }),
  listToDos: async () => [
    {
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
    },
  ],
  listVault: async () => [
    {
      id: "vault-1",
      tripId: "trip-id",
      tripName: "Seoul Spring",
      kind: "note",
      title: "Passport note",
      detail: "Keep copies ready",
      externalUrl: null,
      source: "vault",
      createdAt: "2026-05-30T08:00:00.000Z",
    },
  ],
  createVaultItem: async () => ({
    id: "vault-created",
    tripId: null,
    tripName: null,
    kind: "file",
    title: "Tickets",
    detail: "PDF link",
    externalUrl: "https://example.test/tickets.pdf",
    source: "vault",
    createdAt: "2026-05-30T08:00:00.000Z",
  }),
  createTrip: async (
    _sessionToken: string,
    request: AccountTripCreateRequest,
  ) => ({
    trip: {
      id: "trip-created",
      name: request.name || "Draft trip",
      destinationLabel: request.destinationLabel,
      startDate: request.startDate,
      endDate: request.endDate,
      joinId: request.joinId,
      activePlanVariantId: "plan-main",
      ownerMemberId: "member-owner",
      version: 1,
    },
    ownerMemberId: "member-owner",
    memberSession: {
      tripId: "trip-created",
      memberId: "member-owner",
      sessionToken: "member-session",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    },
  }),
  createTripMemberSession: async () => ({
    tripId: "trip-id",
    memberId: "member-owner",
    sessionToken: "member-session",
    createdAt: "2026-05-30T08:00:00.000Z",
    expiresAt: "2026-06-29T08:00:00.000Z",
  }),
  claimMember: async () => {},
  transferOwner: async () => ({
    tripId: "trip-id",
    previousOwnerMemberId: "member-owner",
    newOwnerMemberId: "member-target",
  }),
  startPasskeyRegistration: async () => ({
    challengeId: "passkey-challenge",
    challenge: "AQIDBA",
    expiresAt: "2026-05-30T09:00:00.000Z",
  }),
  finishPasskeyRegistration: async () => ({
    id: "passkey-id",
    nickname: "Aom passkey",
    createdAt: "2026-05-30T08:00:00.000Z",
    lastUsedAt: null,
  }),
  startPasskeyLogin: async () => ({
    challengeId: "passkey-login-challenge",
    challenge: "AQIDBA",
    expiresAt: "2026-05-30T09:00:00.000Z",
    allowCredentials: [{ credentialId: "BQYH" }],
  }),
  finishPasskeyLogin: async () => trustedStorySession,
  revokeTrustedDevice: async () => {},
  logout: async () => {},
};

export const accountStoryTripApiClient = {
  rotateJoinInviteToken: async () => ({
    token: "created-token",
    expiresAt: "2026-06-30T00:00:00.000Z",
  }),
} as unknown as TripApiClient;
