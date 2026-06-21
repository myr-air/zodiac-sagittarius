import type {
  PlaceResolutionResponse,
  StopNote,
  Suggestion,
} from "../types";
import { parseItineraryImportDocument } from "../itinerary-import-export";
import { tripApiRoutes } from "../api-routes";
import {
  serializeItineraryLocation,
  type TripApiRequester,
} from "./api-client-transport";
import type { TripApiClient } from "./api-client-types";
import {
  mapItineraryItem,
} from "./api-response-itinerary-mappers";
import type {
  ItineraryItemResponse,
} from "./api-response-types";

type TripItineraryApiClient = Pick<
  TripApiClient,
  | "createItineraryItem"
  | "patchItineraryItem"
  | "deleteItineraryItem"
  | "reorderItineraryItems"
  | "importItinerary"
  | "resolvePlace"
  | "createSuggestion"
  | "approveSuggestion"
  | "rejectSuggestion"
  | "createStopNote"
  | "patchStopNote"
  | "deleteStopNote"
>;

export function createTripItineraryApiClient(request: TripApiRequester): TripItineraryApiClient {
  return {
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
  };
}
