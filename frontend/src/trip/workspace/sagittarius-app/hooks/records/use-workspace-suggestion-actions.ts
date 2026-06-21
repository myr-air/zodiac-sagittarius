import { useCallback } from "react";
import { nextClientMutationId, nextLocalSuggestionId } from "@/src/trip/identity";
import {
  approveSuggestion,
  buildCreateEditSuggestionRequest,
  createLocalEditSuggestion,
  rejectSuggestionById,
  replaceSuggestionById,
} from "@/src/trip/itinerary-core";
import type { TripApiClient } from "@/src/trip/api-client";
import type {
  ItineraryItem,
  Suggestion,
  SuggestionReviewDecision,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";

interface UseWorkspaceSuggestionActionsParams {
  canCreateSuggestion: boolean;
  canReviewSuggestions: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  currentMemberId: string;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolveApiClient?: TripApiClient;
  selectedItem: ItineraryItem | null;
  setSuggestions: (updater: (current: Suggestion[]) => Suggestion[]) => void;
  suggestions: Suggestion[];
  trip: Trip;
}

export function useWorkspaceSuggestionActions({
  canCreateSuggestion,
  canReviewSuggestions,
  commitTrip,
  currentMemberId,
  isApiMode,
  participantSession,
  resolveApiClient,
  selectedItem,
  setSuggestions,
  suggestions,
  trip,
}: UseWorkspaceSuggestionActionsParams) {
  const suggestSelectedStop = useCallback(async () => {
    if (!canCreateSuggestion || !selectedItem) return;
    if (isApiMode && resolveApiClient && participantSession) {
      const suggestion = await resolveApiClient.createSuggestion(
        trip.id,
        participantSession.sessionToken,
        buildCreateEditSuggestionRequest(selectedItem, {
          clientMutationId: nextClientMutationId("suggestion-create"),
        }),
      );
      setSuggestions((current) => [...current, suggestion]);
      return;
    }
    setSuggestions((current) => [
      ...current,
      createLocalEditSuggestion(current, {
        tripId: trip.id,
        proposerId: currentMemberId,
        targetItem: selectedItem,
        createdAt: new Date().toISOString(),
        nextSuggestionId: nextLocalSuggestionId,
      }),
    ]);
  }, [
    canCreateSuggestion,
    currentMemberId,
    isApiMode,
    participantSession,
    resolveApiClient,
    selectedItem,
    setSuggestions,
    trip,
  ]);

  const reviewSuggestion = useCallback(async (
    suggestionId: string,
    decision: SuggestionReviewDecision,
  ) => {
    if (!canReviewSuggestions) return;
    if (isApiMode && resolveApiClient && participantSession) {
      let suggestion: Suggestion;
      if (decision === "approved") {
        suggestion = await resolveApiClient.approveSuggestion(
          trip.id,
          suggestionId,
          participantSession.sessionToken,
        );
      } else {
        suggestion = await resolveApiClient.rejectSuggestion(
          trip.id,
          suggestionId,
          participantSession.sessionToken,
        );
      }
      setSuggestions((current) =>
        replaceSuggestionById(current, suggestionId, suggestion),
      );
      return;
    }
    if (decision === "rejected") {
      setSuggestions((current) => rejectSuggestionById(current, suggestionId));
      return;
    }
    const suggestion = suggestions.find(
      (candidate) => candidate.id === suggestionId,
    );
    if (!suggestion) return;
    const result = approveSuggestion(trip.itineraryItems, suggestion);
    if (result.status === "approved") {
      commitTrip((current) => ({ ...current, itineraryItems: result.items }));
    }
    setSuggestions((current) =>
      current.map((candidate) =>
        candidate.id === suggestionId ? result.suggestion : candidate,
      ),
    );
  }, [
    canReviewSuggestions,
    commitTrip,
    isApiMode,
    participantSession,
    resolveApiClient,
    setSuggestions,
    suggestions,
    trip.id,
    trip.itineraryItems,
  ]);

  return {
    reviewSuggestion,
    suggestSelectedStop,
  };
}
