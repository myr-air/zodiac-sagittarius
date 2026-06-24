import { useCallback } from "react";
import { nextClientMutationId, nextLocalSuggestionId } from "@/src/trip/identity";
import {
  buildCreateEditSuggestionRequest,
  createLocalEditSuggestion,
} from "@/src/trip/itinerary-core";
import type {
  SuggestSelectedStopCommand,
  UseSuggestSelectedStopCommandParams,
} from "./workspace-suggestion-command-types";

export function useSuggestSelectedStopCommand({
  canCreateSuggestion,
  currentMemberId,
  isApiMode,
  participantSession,
  resolveApiClient,
  selectedItem,
  setSuggestions,
  trip,
}: UseSuggestSelectedStopCommandParams): SuggestSelectedStopCommand {
  return useCallback(
    async () => {
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
    },
    [
      canCreateSuggestion,
      currentMemberId,
      isApiMode,
      participantSession,
      resolveApiClient,
      selectedItem,
      setSuggestions,
      trip,
    ],
  );
}
