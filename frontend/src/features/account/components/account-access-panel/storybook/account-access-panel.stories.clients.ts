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
  accountTravelerTrip,
  accountTrip,
  accountTodos,
  accountVaultItems,
  createAccountTripCreateResponse,
  createdAccountVaultItem,
  createTrustedAccountSession,
} from "../fixtures/account-access-panel-fixtures";

export const trustedStorySession = createTrustedAccountSession();

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
  loadExplorer: async () => accountExplorerSummary,
  listToDos: async () => accountTodos,
  listVault: async () => accountVaultItems,
  createVaultItem: async () => createdAccountVaultItem,
  createTrip: async (
    _sessionToken: string,
    request: AccountTripCreateRequest,
  ) => createAccountTripCreateResponse(request),
  createTripMemberSession: async () => accountExistingMemberSession,
  claimMember: async () => {},
  transferOwner: async () => accountOwnerTransfer,
  startPasskeyRegistration: async () => accountPasskeyRegistrationChallenge,
  finishPasskeyRegistration: async () => accountPasskey,
  startPasskeyLogin: async () => accountPasskeyLoginChallenge,
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
