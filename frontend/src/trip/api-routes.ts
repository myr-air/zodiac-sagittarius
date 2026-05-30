function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment);
}

export const tripApiRoutes = {
  joinSession: () => "/api/v1/trip-join-sessions",
  trip: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}`,
  claimMember: (tripId: string, memberId: string) =>
    `/api/v1/trips/${encodePathSegment(tripId)}/members/${encodePathSegment(memberId)}/claims`,
  memberSessions: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/member-sessions`,
  currentMemberSession: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/member-sessions/current`,
  tasks: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/tasks`,
  task: (tripId: string, taskId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/tasks/${encodePathSegment(taskId)}`,
  itineraryItem: (tripId: string, itemId: string) =>
    `/api/v1/trips/${encodePathSegment(tripId)}/itinerary-items/${encodePathSegment(itemId)}`,
  suggestions: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/suggestions`,
  suggestion: (tripId: string, suggestionId: string) =>
    `/api/v1/trips/${encodePathSegment(tripId)}/suggestions/${encodePathSegment(suggestionId)}`,
  updateMember: (tripId: string, memberId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/members/${encodePathSegment(memberId)}`,
};

export const tripAuthApiRoutes = {
  join: tripApiRoutes.joinSession,
  claimMember: tripApiRoutes.claimMember,
  loginMember: tripApiRoutes.memberSessions,
  logout: tripApiRoutes.currentMemberSession,
  updateMember: tripApiRoutes.updateMember,
};
