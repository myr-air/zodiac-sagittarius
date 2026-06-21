import type { TripDailyBriefing } from "../types";
import { tripApiRoutes } from "../api-routes";
import { createTripApiRequester } from "./api-client-transport";
import { createTripItineraryApiClient } from "./api-client-itinerary";
import { createTripMemberApiClient } from "./api-client-members";
import { createTripPlanningApiClient } from "./api-client-planning";
import { createTripRecordApiClient } from "./api-client-records";
import type {
  TripApiClient,
  TripApiClientOptions,
} from "./api-client-types";
import {
  mapCockpitResponse,
} from "./api-response-cockpit-mappers";
import {
  mapTripSummary,
} from "./api-response-planning-mappers";
import type {
  TripCockpitResponse,
  TripSummaryResponse,
} from "./api-response-types";
export { TripApiError } from "../api-error";
export {
  assertMainPlanPointerAliasesMatch,
} from "./api-response-planning-mappers";
export { mapCockpitResponse } from "./api-response-cockpit-mappers";
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
} from "./api-response-types";
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

  return {
    ...createTripMemberApiClient(request),
    ...createTripPlanningApiClient(request),
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
    ...createTripItineraryApiClient(request),
    ...createTripRecordApiClient(request),
  };
}
