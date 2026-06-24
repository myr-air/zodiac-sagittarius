import { encodeApiPathSegment } from "@/src/shared/api/api-route-helpers";

export const accountApiRoutes = {
  emailChallenges: () => "/api/v1/auth/email/challenges",
  emailSessions: () => "/api/v1/auth/email/sessions",
  passwordSessions: () => "/api/v1/auth/password/sessions",
  passkeyLoginOptions: () => "/api/v1/auth/passkeys/options",
  passkeyLoginSessions: () => "/api/v1/auth/passkeys/sessions",
  account: () => "/api/v1/account",
  accountTrips: () => "/api/v1/account/trips",
  accountTripMemberSessions: (tripId: string) => `/api/v1/account/trips/${encodeApiPathSegment(tripId)}/member-sessions`,
  accountTripStats: () => "/api/v1/account/trip-stats",
  accountExplorer: () => "/api/v1/account/explorer",
  accountToDos: () => "/api/v1/account/to-dos",
  accountVault: () => "/api/v1/account/vault",
  passkeyRegistrationOptions: () => "/api/v1/account/passkeys/options",
  passkeys: () => "/api/v1/account/passkeys",
  trustedDevice: (trustedDeviceId: string) => `/api/v1/account/trusted-devices/${encodeApiPathSegment(trustedDeviceId)}`,
  accountSession: () => "/api/v1/account/session",
  memberAccountLink: (tripId: string, memberId: string) =>
    `/api/v1/trips/${encodeApiPathSegment(tripId)}/members/${encodeApiPathSegment(memberId)}/account-links`,
  ownershipTransfers: (tripId: string) => `/api/v1/trips/${encodeApiPathSegment(tripId)}/ownership-transfers`,
};
