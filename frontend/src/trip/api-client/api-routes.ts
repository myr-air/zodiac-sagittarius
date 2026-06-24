import {
  apiQueryString,
  encodeApiPathSegment,
} from "@/src/shared/api/api-route-helpers";
import { decodeTripId } from "@/src/trip/identity";

function tripPathSegment(tripId: string): string {
  return encodeApiPathSegment(decodeTripId(tripId));
}

function tripPlanQuery(tripPlanId?: string | null): string {
  return apiQueryString({ tripPlanId });
}

export const tripApiRoutes = {
  joinSession: () => "/api/v1/trip-join-sessions",
  joinInviteTokenCurrent: (token: string) => `/api/v1/trip-join-invite-tokens/current${apiQueryString({ token })}`,
  joinInviteTokens: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/join-invite-tokens`,
  trip: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}`,
  claimMember: (tripId: string, memberId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/members/${encodeApiPathSegment(memberId)}/claims`,
  memberSessions: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/member-sessions`,
  currentMemberSession: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/member-sessions/current`,
  dailyBriefings: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/daily-briefings`,
  dailyBriefing: (tripId: string, date: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/daily-briefings/${encodeApiPathSegment(date)}`,
  members: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/members`,
  member: (tripId: string, memberId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/members/${encodeApiPathSegment(memberId)}`,
  presence: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/presence`,
  planVariants: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/plan-variants`,
  planVariant: (tripId: string, planVariantId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/plan-variants/${encodeApiPathSegment(planVariantId)}`,
  planVariantPublications: (tripId: string, planVariantId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/plan-variants/${encodeApiPathSegment(planVariantId)}/publications`,
  tripPlans: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/trip-plans`,
  tripPlan: (tripId: string, tripPlanId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/trip-plans/${encodeApiPathSegment(tripPlanId)}`,
  setMainTripPlan: (tripId: string, tripPlanId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/trip-plans/${encodeApiPathSegment(tripPlanId)}/set-main`,
  resetMemberClaim: (tripId: string, memberId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/members/${encodeApiPathSegment(memberId)}/claim-resets`,
  tasks: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/tasks`,
  task: (tripId: string, taskId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/tasks/${encodeApiPathSegment(taskId)}`,
  itineraryItems: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/itinerary-items`,
  itineraryImports: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/itinerary-imports`,
  resolvePlace: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/places/resolve`,
  itineraryItem: (tripId: string, itemId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/itinerary-items/${encodeApiPathSegment(itemId)}`,
  reorderItineraryItems: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/itinerary-items/order`,
  planChecks: (tripId: string, tripPlanId?: string | null) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/plan-checks${tripPlanQuery(tripPlanId)}`,
  latestPlanCheck: (tripId: string, tripPlanId?: string | null) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/plan-checks/latest${tripPlanQuery(tripPlanId)}`,
  planSuggestion: (tripId: string, suggestionId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/plan-suggestions/${encodeApiPathSegment(suggestionId)}`,
  suggestions: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/suggestions`,
  suggestion: (tripId: string, suggestionId: string) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/suggestions/${encodeApiPathSegment(suggestionId)}`,
  expensesSummary: (tripId: string, tripPlanId?: string | null) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/expenses/summary${tripPlanQuery(tripPlanId)}`,
  expenseReminders: (tripId: string, tripPlanId?: string | null) =>
    `/api/v1/trips/${tripPathSegment(tripId)}/expenses/reminders${tripPlanQuery(tripPlanId)}`,
  expenses: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/expenses`,
  expense: (tripId: string, expenseId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/expenses/${encodeApiPathSegment(expenseId)}`,
  bookings: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/bookings`,
  booking: (tripId: string, bookingId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/bookings/${encodeApiPathSegment(bookingId)}`,
  photoAlbums: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/photo-albums`,
  photoAlbum: (tripId: string, albumId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/photo-albums/${encodeApiPathSegment(albumId)}`,
  stopNotes: (tripId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/stop-notes`,
  stopNote: (tripId: string, noteId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/stop-notes/${encodeApiPathSegment(noteId)}`,
  updateMember: (tripId: string, memberId: string) => `/api/v1/trips/${tripPathSegment(tripId)}/members/${encodeApiPathSegment(memberId)}`,
};

export const tripAuthApiRoutes = {
  join: tripApiRoutes.joinSession,
  claimMember: tripApiRoutes.claimMember,
  loginMember: tripApiRoutes.memberSessions,
  logout: tripApiRoutes.currentMemberSession,
  updateMember: tripApiRoutes.updateMember,
};
