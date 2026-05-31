function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment);
}

export const accountApiRoutes = {
  emailChallenges: () => "/api/v1/auth/email/challenges",
  emailSessions: () => "/api/v1/auth/email/sessions",
  passwordSessions: () => "/api/v1/auth/password/sessions",
  passkeyLoginOptions: () => "/api/v1/auth/passkeys/options",
  passkeyLoginSessions: () => "/api/v1/auth/passkeys/sessions",
  account: () => "/api/v1/account",
  accountTrips: () => "/api/v1/account/trips",
  accountTripStats: () => "/api/v1/account/trip-stats",
  passkeyRegistrationOptions: () => "/api/v1/account/passkeys/options",
  passkeys: () => "/api/v1/account/passkeys",
  trustedDevice: (trustedDeviceId: string) => `/api/v1/account/trusted-devices/${encodePathSegment(trustedDeviceId)}`,
  accountSession: () => "/api/v1/account/session",
  memberAccountLink: (tripId: string, memberId: string) =>
    `/api/v1/trips/${encodePathSegment(tripId)}/members/${encodePathSegment(memberId)}/account-links`,
  ownershipTransfers: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/ownership-transfers`,
};
