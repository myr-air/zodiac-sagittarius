import { vi } from "vitest";
import type {
  AccountApiClient,
  AccountSession,
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

export {
  accountSettings,
  accountStats,
  accountTravelerTrip,
  accountTrip,
} from "../account-access-panel-fixtures";

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

export function createAccountClient(): AccountApiClient {
  return {
    startEmailLogin: vi.fn().mockResolvedValue({ challengeId: "login-challenge", expiresAt: "2026-05-30T09:00:00.000Z" }),
    finishEmailLogin: vi.fn().mockResolvedValue(createTrustedAccountSession()),
    finishPasswordLogin: vi.fn().mockResolvedValue(createTrustedAccountSession()),
    loadSettings: vi.fn().mockResolvedValue(accountSettings),
    updateSettings: vi.fn().mockImplementation((_sessionToken: string, request: AccountSettingsUpdateRequest) =>
      Promise.resolve({
        ...accountSettings,
        profile: {
          ...accountSettings.profile,
          ...request,
        },
      }),
    ),
    listTrips: vi.fn().mockResolvedValue([accountTrip, accountTravelerTrip]),
    loadStats: vi.fn().mockResolvedValue(accountStats),
    loadExplorer: vi.fn().mockResolvedValue({
      upcomingTrips: 1,
      ownedTrips: 1,
      destinationCount: 2,
      nextTrip: accountTrip,
    }),
    listToDos: vi.fn().mockResolvedValue([
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
    ]),
    listVault: vi.fn().mockResolvedValue([
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
    ]),
    createVaultItem: vi.fn().mockResolvedValue({
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
    createTrip: vi.fn().mockImplementation((_sessionToken: string, request: AccountTripCreateRequest) =>
      Promise.resolve({
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
        memberSession: {
          tripId: "trip-created",
          memberId: "member-owner",
          sessionToken: "member-session",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        },
      }),
    ),
    createTripMemberSession: vi.fn().mockResolvedValue({
      tripId: "trip-id",
      memberId: "member-owner",
      sessionToken: "member-session",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    }),
    claimMember: vi.fn().mockResolvedValue(undefined),
    transferOwner: vi.fn().mockResolvedValue({
      tripId: "trip-id",
      previousOwnerMemberId: "member-owner",
      newOwnerMemberId: "member-target",
    }),
    startPasskeyRegistration: vi.fn().mockResolvedValue({
      challengeId: "passkey-challenge",
      challenge: "AQIDBA",
      expiresAt: "2026-05-30T09:00:00.000Z",
    }),
    finishPasskeyRegistration: vi.fn().mockResolvedValue({
      id: "passkey-id",
      nickname: "Aom passkey",
      createdAt: "2026-05-30T08:00:00.000Z",
      lastUsedAt: null,
    }),
    startPasskeyLogin: vi.fn().mockResolvedValue({
      challengeId: "passkey-login-challenge",
      challenge: "AQIDBA",
      expiresAt: "2026-05-30T09:00:00.000Z",
      allowCredentials: [{ credentialId: "BQYH" }],
    }),
    finishPasskeyLogin: vi.fn().mockResolvedValue({
      userId: "user-aom",
      sessionToken: "passkey-session",
      kind: "trusted",
      trustedDeviceId: "device-passkey",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    }),
    revokeTrustedDevice: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  };
}

export function createTripApiClient(): TripApiClient {
  return {
    rotateJoinInviteToken: vi.fn().mockResolvedValue({ token: "created-token", expiresAt: "2026-06-30T00:00:00.000Z" }),
  } as unknown as TripApiClient;
}

export function stubCredentials() {
  const credentials = {
    create: vi.fn().mockResolvedValue({
      rawId: bytes([5, 6, 7]),
      response: {
        clientDataJSON: bytes([8, 9]),
        attestationObject: bytes([10, 11, 12]),
      },
    }),
    get: vi.fn().mockResolvedValue({
      rawId: bytes([5, 6, 7]),
      response: {
        clientDataJSON: bytes([8, 9]),
        authenticatorData: bytes([13, 14]),
        signature: bytes([15, 16]),
      },
    }),
  };
  Object.defineProperty(navigator, "credentials", {
    configurable: true,
    value: credentials,
  });
  return credentials;
}

export function bytes(values: number[]) {
  return Uint8Array.from(values).buffer;
}
