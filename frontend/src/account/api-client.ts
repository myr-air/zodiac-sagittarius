import type { TripParticipantSession, TripRole } from "@/src/trip/types";
import { TripApiError, type TripSummaryResponse } from "@/src/trip/api-client";

export type AccountSessionKind = "temporary" | "trusted";

export interface AccountProfile {
  id: string;
  displayName: string;
  avatarColor: string;
  locale: string;
  timezone: string;
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
  destinationLabel: string;
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
  destinationLabel: string;
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
  createTrip(sessionToken: string, request: AccountTripCreateRequest): Promise<AccountTripCreateResponse>;
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

export function createAccountApiClient(options: AccountApiClientOptions = {}): AccountApiClient {
  const fetcher = options.fetchImpl ?? fetch;
  const baseUrl = trimTrailingSlash(options.baseUrl ?? "");

  async function request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetcher(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  function authHeaders(sessionToken: string) {
    return { Authorization: `Bearer ${sessionToken}` };
  }

  return {
    startEmailLogin(email) {
      return request<EmailLoginStartResponse>("/v1/account/email-login/start", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    startPasskeyLogin(email) {
      return request<PasskeyLoginStartResponse>("/v1/account/passkeys/login/start", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    finishPasskeyLogin(input) {
      return request<AccountSession>("/v1/account/passkeys/login/finish", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    finishEmailLogin(input) {
      return request<AccountSession>("/v1/account/email-login/finish", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    loadSettings(sessionToken) {
      return request<AccountSettings>("/v1/account/settings", {
        method: "GET",
        headers: authHeaders(sessionToken),
      });
    },
    updateSettings(sessionToken, settingsRequest) {
      return request<AccountSettings>("/v1/account/settings", {
        method: "PATCH",
        headers: authHeaders(sessionToken),
        body: JSON.stringify(settingsRequest),
      });
    },
    listTrips(sessionToken) {
      return request<AccountTripSummary[]>("/v1/account/trips", {
        method: "GET",
        headers: authHeaders(sessionToken),
      });
    },
    loadStats(sessionToken) {
      return request<AccountTripStats>("/v1/account/stats", {
        method: "GET",
        headers: authHeaders(sessionToken),
      });
    },
    createTrip(sessionToken, tripRequest) {
      return request<AccountTripCreateResponse>("/v1/account/trips", {
        method: "POST",
        headers: authHeaders(sessionToken),
        body: JSON.stringify(tripRequest),
      });
    },
    async claimMember(sessionToken, tripId, memberId, memberSessionToken) {
      await request<void>(`/v1/account/trips/${encodePath(tripId)}/members/${encodePath(memberId)}/claim`, {
        method: "POST",
        headers: authHeaders(sessionToken),
        body: JSON.stringify({ memberSessionToken }),
      });
    },
    transferOwner(sessionToken, tripId, targetMemberId) {
      return request<OwnerTransferResponse>(`/v1/account/trips/${encodePath(tripId)}/owner-transfer`, {
        method: "POST",
        headers: authHeaders(sessionToken),
        body: JSON.stringify({ targetMemberId }),
      });
    },
    startPasskeyRegistration(sessionToken) {
      return request<PasskeyChallengeResponse>("/v1/account/passkeys/register/start", {
        method: "POST",
        headers: authHeaders(sessionToken),
      });
    },
    finishPasskeyRegistration(sessionToken, input) {
      return request<PasskeySummary>("/v1/account/passkeys/register/finish", {
        method: "POST",
        headers: authHeaders(sessionToken),
        body: JSON.stringify(input),
      });
    },
    async revokeTrustedDevice(sessionToken, trustedDeviceId) {
      await request<void>(`/v1/account/trusted-devices/${encodePath(trustedDeviceId)}`, {
        method: "DELETE",
        headers: authHeaders(sessionToken),
      });
    },
    async logout(sessionToken) {
      await request<void>("/v1/account/sessions/logout", {
        method: "POST",
        headers: authHeaders(sessionToken),
      });
    },
  };
}

async function toApiError(response: Response): Promise<TripApiError> {
  const fallback = { code: "request_failed", message: `request failed with ${response.status}` };
  const body = (await response.json().catch(() => fallback)) as Partial<typeof fallback>;
  return new TripApiError({
    code: body.code ?? fallback.code,
    message: body.message ?? fallback.message,
    status: response.status,
  });
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function encodePath(value: string): string {
  return encodeURIComponent(value);
}
