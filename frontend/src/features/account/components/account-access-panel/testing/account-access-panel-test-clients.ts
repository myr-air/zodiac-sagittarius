import { vi } from "vitest";
import type {
  AccountApiClient,
  AccountSettingsUpdateRequest,
  AccountTripCreateRequest,
} from "@/src/account/api-client";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  accountExplorerSummary,
  accountExistingMemberSession,
  accountOwnerTransfer,
  accountPasskey,
  accountPasskeyLoginChallenge,
  accountPasskeyRegistrationChallenge,
  accountSettings,
  accountStats,
  accountTrips,
  accountTodos,
  accountVaultItems,
  createAccountTripCreateResponse,
  createdAccountVaultItem,
  createTrustedAccountSession,
} from "../fixtures/account-access-panel-fixtures";

export {
  accountSettings,
  accountStats,
  accountTravelerTrip,
  accountTrip,
  accountTrips,
  createTrustedAccountSession,
} from "../fixtures/account-access-panel-fixtures";

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
    listTrips: vi.fn().mockResolvedValue(accountTrips),
    loadStats: vi.fn().mockResolvedValue(accountStats),
    loadExplorer: vi.fn().mockResolvedValue(accountExplorerSummary),
    listToDos: vi.fn().mockResolvedValue(accountTodos),
    listVault: vi.fn().mockResolvedValue(accountVaultItems),
    createVaultItem: vi.fn().mockResolvedValue(createdAccountVaultItem),
    createTrip: vi.fn().mockImplementation((_sessionToken: string, request: AccountTripCreateRequest) =>
      Promise.resolve(createAccountTripCreateResponse(request)),
    ),
    createTripMemberSession: vi.fn().mockResolvedValue(accountExistingMemberSession),
    claimMember: vi.fn().mockResolvedValue(undefined),
    transferOwner: vi.fn().mockResolvedValue(accountOwnerTransfer),
    startPasskeyRegistration: vi.fn().mockResolvedValue(accountPasskeyRegistrationChallenge),
    finishPasskeyRegistration: vi.fn().mockResolvedValue(accountPasskey),
    startPasskeyLogin: vi.fn().mockResolvedValue(accountPasskeyLoginChallenge),
    finishPasskeyLogin: vi.fn().mockResolvedValue(createTrustedAccountSession({
      sessionToken: "passkey-session",
      trustedDeviceId: "device-passkey",
    })),
    revokeTrustedDevice: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  };
}

export function createTripApiClient(): TripApiClient {
  return {
    rotateJoinInviteToken: vi.fn().mockResolvedValue({ token: "created-token", expiresAt: "2026-06-30T00:00:00.000Z" }),
  } as unknown as TripApiClient;
}
