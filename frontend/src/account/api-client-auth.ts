import type { JsonApiRequester } from "@/src/shared/api/json-api-requester";
import { accountApiRoutes } from "./api-routes";
import type {
  AccountApiClient,
  AccountSession,
  EmailLoginStartResponse,
  PasskeyChallengeResponse,
  PasskeyLoginStartResponse,
  PasskeySummary,
} from "./api-client-types";

type AccountAuthApiClient = Pick<
  AccountApiClient,
  | "startEmailLogin"
  | "finishPasswordLogin"
  | "startPasskeyLogin"
  | "finishPasskeyLogin"
  | "finishEmailLogin"
  | "startPasskeyRegistration"
  | "finishPasskeyRegistration"
  | "revokeTrustedDevice"
  | "logout"
>;

export function createAccountAuthApiClient(
  request: JsonApiRequester,
  authHeaders: (sessionToken: string) => { Authorization: string },
): AccountAuthApiClient {
  return {
    startEmailLogin(email) {
      return request<EmailLoginStartResponse>(accountApiRoutes.emailChallenges(), {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    startPasskeyLogin(email) {
      return request<PasskeyLoginStartResponse>(accountApiRoutes.passkeyLoginOptions(), {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    finishPasswordLogin(input) {
      return request<AccountSession>(accountApiRoutes.passwordSessions(), {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    finishPasskeyLogin(input) {
      return request<AccountSession>(accountApiRoutes.passkeyLoginSessions(), {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    finishEmailLogin(input) {
      return request<AccountSession>(accountApiRoutes.emailSessions(), {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    startPasskeyRegistration(sessionToken) {
      return request<PasskeyChallengeResponse>(accountApiRoutes.passkeyRegistrationOptions(), {
        method: "POST",
        headers: authHeaders(sessionToken),
      });
    },
    finishPasskeyRegistration(sessionToken, input) {
      return request<PasskeySummary>(accountApiRoutes.passkeys(), {
        method: "POST",
        headers: authHeaders(sessionToken),
        body: JSON.stringify(input),
      });
    },
    async revokeTrustedDevice(sessionToken, trustedDeviceId) {
      await request<void>(accountApiRoutes.trustedDevice(trustedDeviceId), {
        method: "DELETE",
        headers: authHeaders(sessionToken),
      });
    },
    async logout(sessionToken) {
      await request<void>(accountApiRoutes.accountSession(), {
        method: "DELETE",
        headers: authHeaders(sessionToken),
      });
    },
  };
}
