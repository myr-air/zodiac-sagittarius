import { decodeTripId } from "@/src/trip/ids";

function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment);
}

function tripPathSegment(tripId: string): string {
  return encodePathSegment(decodeTripId(tripId));
}

export const tripApiRoutes = {
  joinSession: () => "/api/v1/trip-join-sessions",
  joinInviteTokenCurrent: (token: string) => `/api/v1/trip-join-invite-tokens/current?${new URLSearchParams({ token })}`,
  joinInviteTokens: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/join-invite-tokens`,
  trip: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}`,
  claimMember: (tripId: string, memberId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/members/${encodePathSegment(memberId)}/claims`,
  memberSessions: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/member-sessions`,
  currentMemberSession: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/member-sessions/current`,
  dailyBriefings: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/daily-briefings`,
  dailyBriefing: (tripId: string, date: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/daily-briefings/${encodePathSegment(date)}`,
  members: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/members`,
  member: (tripId: string, memberId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/members/${encodePathSegment(memberId)}`,
  presence: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/presence`,
  planVariants: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/plan-variants`,
  planVariant: (tripId: string, planVariantId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/plan-variants/${encodePathSegment(planVariantId)}`,
  planVariantPublications: (tripId: string, planVariantId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/plan-variants/${encodePathSegment(planVariantId)}/publications`,
  resetMemberClaim: (tripId: string, memberId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/members/${encodePathSegment(memberId)}/claim-resets`,
  tasks: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/tasks`,
  task: (tripId: string, taskId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/tasks/${encodePathSegment(taskId)}`,
  itineraryItems: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/itinerary-items`,
  itineraryImports: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/itinerary-imports`,
  resolvePlace: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/places/resolve`,
  itineraryItem: (tripId: string, itemId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/itinerary-items/${encodePathSegment(itemId)}`,
  reorderItineraryItems: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/itinerary-items/order`,
  planChecks: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/plan-checks`,
  latestPlanCheck: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/plan-checks/latest`,
  planSuggestion: (tripId: string, suggestionId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/plan-suggestions/${encodePathSegment(suggestionId)}`,
  suggestions: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/suggestions`,
  suggestion: (tripId: string, suggestionId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/suggestions/${encodePathSegment(suggestionId)}`,
  expensesSummary: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/expenses/summary`,
  expenseReminders: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/expenses/reminders`,
  expenses: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/expenses`,
  expense: (tripId: string, expenseId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/expenses/${encodePathSegment(expenseId)}`,
  bookings: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/bookings`,
  booking: (tripId: string, bookingId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/bookings/${encodePathSegment(bookingId)}`,
  photoAlbums: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/photo-albums`,
  photoAlbum: (tripId: string, albumId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/photo-albums/${encodePathSegment(albumId)}`,
  stopNotes: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/stop-notes`,
  stopNote: (tripId: string, noteId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/stop-notes/${encodePathSegment(noteId)}`,
  updateMember: (tripId: string, memberId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/members/${encodePathSegment(memberId)}`,
};

export const tripAuthApiRoutes = {
  join: tripApiRoutes.joinSession,
  claimMember: tripApiRoutes.claimMember,
  loginMember: tripApiRoutes.memberSessions,
  logout: tripApiRoutes.currentMemberSession,
  updateMember: tripApiRoutes.updateMember,
};
