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
  members: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/members`,
  member: (tripId: string, memberId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/members/${encodePathSegment(memberId)}`,
  presence: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/presence`,
  resetMemberClaim: (tripId: string, memberId: string) =>
    `/api/v1/trips/${encodePathSegment(tripId)}/members/${encodePathSegment(memberId)}/claim-resets`,
  tasks: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/tasks`,
  task: (tripId: string, taskId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/tasks/${encodePathSegment(taskId)}`,
  itineraryItems: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/itinerary-items`,
  itineraryItem: (tripId: string, itemId: string) =>
    `/api/v1/trips/${encodePathSegment(tripId)}/itinerary-items/${encodePathSegment(itemId)}`,
  reorderItineraryItems: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/itinerary-items/order`,
  suggestions: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/suggestions`,
  suggestion: (tripId: string, suggestionId: string) =>
    `/api/v1/trips/${encodePathSegment(tripId)}/suggestions/${encodePathSegment(suggestionId)}`,
  expensesSummary: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/expenses/summary`,
  expenses: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/expenses`,
  expense: (tripId: string, expenseId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/expenses/${encodePathSegment(expenseId)}`,
  stopNotes: (tripId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/stop-notes`,
  stopNote: (tripId: string, noteId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/stop-notes/${encodePathSegment(noteId)}`,
  updateMember: (tripId: string, memberId: string) => `/api/v1/trips/${encodePathSegment(tripId)}/members/${encodePathSegment(memberId)}`,
};

export const tripAuthApiRoutes = {
  join: tripApiRoutes.joinSession,
  claimMember: tripApiRoutes.claimMember,
  loginMember: tripApiRoutes.memberSessions,
  logout: tripApiRoutes.currentMemberSession,
  updateMember: tripApiRoutes.updateMember,
};
