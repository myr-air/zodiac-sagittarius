import type { TripParticipantSession } from "@/src/trip/types";
import type {
  AccountSession,
  EmailLoginStartResponse,
  PasskeyChallengeResponse,
  PasskeyLoginStartResponse,
} from "./api-client-auth-types";
import type {
  AccountExplorerSummary,
  AccountSettings,
  AccountSettingsUpdateRequest,
  AccountTodoSummary,
  AccountTripStats,
  AccountVaultItemCreateRequest,
  AccountVaultItemSummary,
  PasskeySummary,
} from "./api-client-portal-types";
import type {
  AccountTripCreateRequest,
  AccountTripCreateResponse,
  AccountTripSummary,
  OwnerTransferResponse,
} from "./api-client-trip-types";

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
  restoreSession(): Promise<AccountSession>;
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
