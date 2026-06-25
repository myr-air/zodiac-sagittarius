import type { TripParticipantSession } from "@/src/trip/types";
import { createJsonApiRequester } from "@/src/shared/api/json-api-requester";
import { TripApiError } from "@/src/trip/api-client";
import { createAccountAuthApiClient } from "./api-client-auth";
import { accountApiRoutes } from "./api-routes";
import type {
  AccountApiClient,
  AccountApiClientOptions,
  AccountExplorerSummary,
  AccountSettings,
  AccountTodoSummary,
  AccountTripCreateResponse,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemSummary,
  OwnerTransferResponse,
} from "./api-client-types";
export type {
  AccountApiClient,
  AccountApiClientOptions,
  AccountExplorerSummary,
  AccountProfile,
  AccountSession,
  AccountSessionKind,
  AccountSettings,
  AccountSettingsUpdateRequest,
  AccountTodoSummary,
  AccountTripCreateRequest,
  AccountTripCreateResponse,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemCreateRequest,
  AccountVaultItemSummary,
  EmailLoginStartResponse,
  OwnerTransferResponse,
  PasskeyChallengeResponse,
  PasskeyLoginStartResponse,
  PasskeySummary,
  TrustedDeviceSummary,
} from "./api-client-types";

export function createAccountApiClient(options: AccountApiClientOptions = {}): AccountApiClient {
  const request = createJsonApiRequester({
    baseUrl: options.baseUrl ?? "",
    credentials: "include",
    fetcher: options.fetchImpl,
    createError: (input) => new TripApiError(input),
  });

  const cookieSessionToken = "cookie-account-session";

  function authHeaders(sessionToken: string): HeadersInit {
    if (sessionToken === cookieSessionToken) return {};
    return { Authorization: `Bearer ${sessionToken}` };
  }

  return {
    ...createAccountAuthApiClient(request, authHeaders),
    async restoreSession() {
      const settings = await request<AccountSettings>(accountApiRoutes.account(), {
        method: "GET",
      });
      return {
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        kind: "trusted",
        sessionToken: cookieSessionToken,
        trustedDeviceId: null,
        userId: settings.profile.id,
      };
    },
    loadSettings(sessionToken) {
      return request<AccountSettings>(accountApiRoutes.account(), {
        method: "GET",
        headers: authHeaders(sessionToken),
      });
    },
    updateSettings(sessionToken, settingsRequest) {
      return request<AccountSettings>(accountApiRoutes.account(), {
        method: "PATCH",
        headers: authHeaders(sessionToken),
        body: JSON.stringify(settingsRequest),
      });
    },
    listTrips(sessionToken) {
      return request<AccountTripSummary[]>(accountApiRoutes.accountTrips(), {
        method: "GET",
        headers: authHeaders(sessionToken),
      });
    },
    loadStats(sessionToken) {
      return request<AccountTripStats>(accountApiRoutes.accountTripStats(), {
        method: "GET",
        headers: authHeaders(sessionToken),
      });
    },
    loadExplorer(sessionToken) {
      return request<AccountExplorerSummary>(accountApiRoutes.accountExplorer(), {
        method: "GET",
        headers: authHeaders(sessionToken),
      });
    },
    listToDos(sessionToken) {
      return request<AccountTodoSummary[]>(accountApiRoutes.accountToDos(), {
        method: "GET",
        headers: authHeaders(sessionToken),
      });
    },
    listVault(sessionToken) {
      return request<AccountVaultItemSummary[]>(accountApiRoutes.accountVault(), {
        method: "GET",
        headers: authHeaders(sessionToken),
      });
    },
    createVaultItem(sessionToken, vaultRequest) {
      return request<AccountVaultItemSummary>(accountApiRoutes.accountVault(), {
        method: "POST",
        headers: authHeaders(sessionToken),
        body: JSON.stringify(vaultRequest),
      });
    },
    createTrip(sessionToken, tripRequest) {
      return request<AccountTripCreateResponse>(accountApiRoutes.accountTrips(), {
        method: "POST",
        headers: authHeaders(sessionToken),
        body: JSON.stringify(tripRequest),
      });
    },
    createTripMemberSession(sessionToken, tripId) {
      return request<TripParticipantSession>(accountApiRoutes.accountTripMemberSessions(tripId), {
        method: "POST",
        headers: authHeaders(sessionToken),
      });
    },
    async claimMember(sessionToken, tripId, memberId, memberSessionToken) {
      await request<void>(accountApiRoutes.memberAccountLink(tripId, memberId), {
        method: "POST",
        headers: authHeaders(sessionToken),
        body: JSON.stringify({ memberSessionToken }),
      });
    },
    transferOwner(sessionToken, tripId, targetMemberId) {
      return request<OwnerTransferResponse>(accountApiRoutes.ownershipTransfers(tripId), {
        method: "POST",
        headers: authHeaders(sessionToken),
        body: JSON.stringify({ targetMemberId }),
      });
    },
  };
}
