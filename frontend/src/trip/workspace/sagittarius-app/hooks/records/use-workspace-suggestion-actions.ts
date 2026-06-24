import type { TripApiClient } from "@/src/trip/api-client";
import type {
  ItineraryItem,
  Suggestion,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { useReviewWorkspaceSuggestionCommand } from "./use-review-workspace-suggestion-command";
import { useSuggestSelectedStopCommand } from "./use-suggest-selected-stop-command";

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
  const suggestSelectedStop = useSuggestSelectedStopCommand({
    canCreateSuggestion,
    currentMemberId,
    isApiMode,
    participantSession,
    resolveApiClient,
    selectedItem,
    setSuggestions,
    trip,
  });

  const reviewSuggestion = useReviewWorkspaceSuggestionCommand({
    canReviewSuggestions,
    commitTrip,
    isApiMode,
    participantSession,
    resolveApiClient,
    setSuggestions,
    suggestions,
    trip,
  });

  return {
    reviewSuggestion,
    suggestSelectedStop,
  };
}
