function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment);
}

export const tripAuthApiRoutes = {
  join: () => "/v1/trips/join",
  claimMember: (tripId: string, memberId: string) => `/v1/trips/${encodePathSegment(tripId)}/members/${encodePathSegment(memberId)}/claim`,
  loginMember: (tripId: string, memberId: string) => `/v1/trips/${encodePathSegment(tripId)}/members/${encodePathSegment(memberId)}/login`,
  logout: (tripId: string) => `/v1/trips/${encodePathSegment(tripId)}/member-session/logout`,
  updateMember: (tripId: string, memberId: string) => `/v1/trips/${encodePathSegment(tripId)}/members/${encodePathSegment(memberId)}`,
};
