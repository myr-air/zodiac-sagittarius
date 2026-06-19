import type {
  PlanCheck,
  PlanSuggestion,
  PlanVariant,
  StopNote,
  Suggestion,
  Trip,
  TripDailyBriefing,
  TripParticipantSession,
  PlaceResolutionResponse,
} from "./types";
import { parseItineraryImportDocument } from "./itinerary-import-export";
import { tripApiRoutes } from "./api-routes";
import {
  createTripApiRequester,
  serializeItineraryLocation,
} from "./api-client-transport";
import { createTripRecordApiClient } from "./api-client-records";
import type {
  CreatePlanVariantApiRequest,
  JoinInviteTokenResponse,
  PatchPlanVariantApiRequest,
  PublishPlanVariantApiRequest,
  TripApiClient,
  TripApiClientOptions,
} from "./api-client-types";
import {
  mapCockpitResponse,
  mapItineraryItem,
  mapJoinTripResponse,
  mapMember,
  mapTask,
  mapTripPlanResponse,
  mapTripSummary,
} from "./api-response-mappers";
import type {
  ItineraryItemResponse,
  JoinTripResponse,
  TripCockpitResponse,
  TripMemberResponse,
  TripPlanResponse,
  TripSummaryResponse,
  TripTaskResponse,
} from "./api-response-mappers";
export { TripApiError } from "./api-error";
export {
  assertMainPlanPointerAliasesMatch,
  mapCockpitResponse,
} from "./api-response-mappers";
export type {
  ExpenseResponse,
  ItineraryItemResponse,
  JoinTripResponse,
  PlanVariantResponse,
  SuggestionResponse,
  TripCockpit,
  TripCockpitResponse,
  TripMemberResponse,
  TripPlanResponse,
  TripSummaryResponse,
  TripTaskResponse,
} from "./api-response-mappers";
export type {
  BookingDocExternalLinkApiRequest,
  CreateBookingDocApiRequest,
  CreateExpenseApiRequest,
  CreateItineraryItemApiRequest,
  CreateMemberApiRequest,
  CreatePhotoAlbumApiRequest,
  CreatePlanVariantApiRequest,
  CreateStopNoteApiRequest,
  CreateSuggestionApiRequest,
  CreateTaskApiRequest,
  ImportItineraryApiRequest,
  JoinInviteTokenResponse,
  PatchBookingDocApiRequest,
  PatchDailyBriefingApiRequest,
  PatchExpenseApiRequest,
  PatchItineraryItemApiRequest,
  PatchMemberApiRequest,
  PatchPhotoAlbumApiRequest,
  PatchPlanSuggestionApiRequest,
  PatchPlanVariantApiRequest,
  PatchStopNoteApiRequest,
  PatchTaskApiRequest,
  PatchTripApiRequest,
  PublishPlanVariantApiRequest,
  RecordExpenseReminderApiRequest,
  ReorderItineraryItemsApiRequest,
  TripApiClient,
  TripApiClientOptions,
  UpdatePresenceApiRequest,
} from "./api-client-types";

export function createTripApiClient(options: TripApiClientOptions = {}): TripApiClient {
  const request = createTripApiRequester({
    baseUrl: options.baseUrl ?? "",
    fetcher: options.fetchImpl,
  });

  async function createTripPlan(
    tripId: string,
    sessionToken: string,
    planRequest: CreatePlanVariantApiRequest,
  ): Promise<PlanVariant> {
    const variant = await request<TripPlanResponse>(tripApiRoutes.tripPlans(tripId), {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(planRequest),
    });
    return mapTripPlanResponse(variant);
  }

  async function patchTripPlan(
    tripId: string,
    tripPlanId: string,
    sessionToken: string,
    planRequest: PatchPlanVariantApiRequest,
  ): Promise<PlanVariant> {
    const variant = await request<TripPlanResponse>(tripApiRoutes.tripPlan(tripId, tripPlanId), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(planRequest),
    });
    return mapTripPlanResponse(variant);
  }

  async function setMainTripPlan(
    tripId: string,
    tripPlanId: string,
    sessionToken: string,
    publishRequest: PublishPlanVariantApiRequest,
  ): Promise<Trip> {
    const trip = await request<TripSummaryResponse>(tripApiRoutes.setMainTripPlan(tripId, tripPlanId), {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(publishRequest),
    });
    return mapTripSummary(trip);
  }

  return {
    joinTrip(credentials) {
      return request<JoinTripResponse>(tripApiRoutes.joinSession(), {
        method: "POST",
        body: JSON.stringify({ joinCode: credentials.joinId, tripPassword: credentials.password }),
      }).then(mapJoinTripResponse);
    },
    resolveJoinInviteToken(token) {
      return request<JoinTripResponse>(tripApiRoutes.joinInviteTokenCurrent(token), {
        method: "GET",
      }).then(mapJoinTripResponse);
    },
    rotateJoinInviteToken(tripId, sessionToken) {
      return request<JoinInviteTokenResponse>(tripApiRoutes.joinInviteTokens(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    claimMember(tripId, memberId, participantPassword, joinSessionToken) {
      return request<TripParticipantSession>(tripApiRoutes.claimMember(tripId, memberId), {
        method: "POST",
        body: JSON.stringify({ participantPassword, joinSessionToken }),
      });
    },
    loginMember(tripId, memberId, participantPassword, joinSessionToken) {
      return request<TripParticipantSession>(tripApiRoutes.memberSessions(tripId), {
        method: "POST",
        body: JSON.stringify({ memberId, participantPassword, joinSessionToken }),
      });
    },
    async logout(tripId, sessionToken) {
      await request<void>(tripApiRoutes.currentMemberSession(tripId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    async loadTrip(tripId, sessionToken) {
      const cockpit = await request<TripCockpitResponse>(tripApiRoutes.trip(tripId), {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return mapCockpitResponse(cockpit);
    },
    listDailyBriefings(tripId, sessionToken) {
      return request<TripDailyBriefing[]>(tripApiRoutes.dailyBriefings(tripId), {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    patchDailyBriefing(tripId, date, sessionToken, patchRequest) {
      return request<TripDailyBriefing>(tripApiRoutes.dailyBriefing(tripId, date), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(patchRequest),
      });
    },
    async patchTrip(tripId, sessionToken, tripRequest) {
      const trip = await request<TripSummaryResponse>(tripApiRoutes.trip(tripId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(tripRequest),
      });
      return mapTripSummary(trip);
    },
    createTripPlan,
    patchTripPlan,
    setMainTripPlan,
    createPlanVariant: createTripPlan,
    patchPlanVariant: patchTripPlan,
    publishPlanVariant: setMainTripPlan,
    async createTask(tripId, sessionToken, taskRequest) {
      const task = await request<TripTaskResponse>(tripApiRoutes.tasks(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(taskRequest),
      });
      return mapTask(task);
    },
    async patchTask(tripId, taskId, sessionToken, taskRequest) {
      const task = await request<TripTaskResponse>(tripApiRoutes.task(tripId, taskId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(taskRequest),
      });
      return mapTask(task);
    },
    async patchItineraryItem(tripId, itemId, sessionToken, itemRequest) {
      const item = await request<ItineraryItemResponse>(tripApiRoutes.itineraryItem(tripId, itemId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({
          ...itemRequest,
          patch: serializeItineraryLocation(itemRequest.patch),
        }),
      });
      return mapItineraryItem(item);
    },
    async createItineraryItem(tripId, sessionToken, itemRequest) {
      const item = await request<ItineraryItemResponse>(tripApiRoutes.itineraryItems(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(serializeItineraryLocation(itemRequest)),
      });
      return mapItineraryItem(item);
    },
    async deleteItineraryItem(tripId, itemId, sessionToken) {
      const item = await request<ItineraryItemResponse>(tripApiRoutes.itineraryItem(tripId, itemId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return mapItineraryItem(item);
    },
    async importItinerary(tripId, sessionToken, importRequest) {
      const document = await request<unknown>(tripApiRoutes.itineraryImports(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(importRequest),
      });
      return parseItineraryImportDocument(JSON.stringify(document));
    },
    async reorderItineraryItems(tripId, sessionToken, reorderRequest) {
      const items = await request<ItineraryItemResponse[]>(tripApiRoutes.reorderItineraryItems(tripId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(reorderRequest),
      });
      return items.map(mapItineraryItem);
    },
    runPlanCheck(tripId, sessionToken, tripPlanId) {
      return request<PlanCheck>(tripApiRoutes.planChecks(tripId, tripPlanId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    latestPlanCheck(tripId, sessionToken, tripPlanId) {
      return request<PlanCheck | null>(tripApiRoutes.latestPlanCheck(tripId, tripPlanId), {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    patchPlanSuggestion(tripId, suggestionId, sessionToken, suggestionRequest) {
      return request<PlanSuggestion>(tripApiRoutes.planSuggestion(tripId, suggestionId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(suggestionRequest),
      });
    },
    resolvePlace(tripId, sessionToken, resolveRequest) {
      return request<PlaceResolutionResponse>(tripApiRoutes.resolvePlace(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(resolveRequest),
      });
    },
    createSuggestion(tripId, sessionToken, suggestionRequest) {
      return request<Suggestion>(tripApiRoutes.suggestions(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(suggestionRequest),
      });
    },
    approveSuggestion(tripId, suggestionId, sessionToken) {
      return request<Suggestion>(tripApiRoutes.suggestion(tripId, suggestionId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ status: "approved" }),
      });
    },
    rejectSuggestion(tripId, suggestionId, sessionToken) {
      return request<Suggestion>(tripApiRoutes.suggestion(tripId, suggestionId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ status: "rejected" }),
      });
    },
    createStopNote(tripId, sessionToken, noteRequest) {
      return request<StopNote>(tripApiRoutes.stopNotes(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(noteRequest),
      });
    },
    patchStopNote(tripId, noteId, sessionToken, noteRequest) {
      return request<StopNote>(tripApiRoutes.stopNote(tripId, noteId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(noteRequest),
      });
    },
    deleteStopNote(tripId, noteId, sessionToken) {
      return request<StopNote>(tripApiRoutes.stopNote(tripId, noteId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    async listMembers(tripId, sessionToken) {
      const members = await request<TripMemberResponse[]>(tripApiRoutes.members(tripId), {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return members.map(mapMember);
    },
    async updatePresence(tripId, sessionToken, presenceRequest) {
      const member = await request<TripMemberResponse>(tripApiRoutes.presence(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(presenceRequest),
      });
      return mapMember(member);
    },
    async createMember(tripId, sessionToken, memberRequest) {
      const member = await request<TripMemberResponse>(tripApiRoutes.members(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(memberRequest),
      });
      return mapMember(member);
    },
    async patchMember(tripId, memberId, sessionToken, memberRequest) {
      const member = await request<TripMemberResponse>(tripApiRoutes.member(tripId, memberId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(memberRequest),
      });
      return mapMember(member);
    },
    async resetMemberClaim(tripId, memberId, sessionToken) {
      const member = await request<TripMemberResponse>(tripApiRoutes.resetMemberClaim(tripId, memberId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return mapMember(member);
    },
    ...createTripRecordApiClient(request),
  };
}
