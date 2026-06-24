import { useCallback } from "react";
import {
  approveSuggestion,
  rejectSuggestionById,
  replaceSuggestionById,
} from "@/src/trip/itinerary-core";
import type { Suggestion } from "@/src/trip/types";
import type {
  ReviewSuggestionCommand,
  UseReviewWorkspaceSuggestionCommandParams,
} from "./workspace-suggestion-command-types";

export function useReviewWorkspaceSuggestionCommand({
  canReviewSuggestions,
  commitTrip,
  isApiMode,
  participantSession,
  resolveApiClient,
  setSuggestions,
  suggestions,
  trip,
}: UseReviewWorkspaceSuggestionCommandParams): ReviewSuggestionCommand {
  return useCallback(
    async (suggestionId, decision) => {
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
    },
    [
      canReviewSuggestions,
      commitTrip,
      isApiMode,
      participantSession,
      resolveApiClient,
      setSuggestions,
      suggestions,
      trip.id,
      trip.itineraryItems,
    ],
  );
}
