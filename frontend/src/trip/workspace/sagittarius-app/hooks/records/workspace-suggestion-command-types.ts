import type { TripApiClient } from "@/src/trip/api-client";
import type {
  ItineraryItem,
  Suggestion,
  SuggestionReviewDecision,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";

export interface WorkspaceSuggestionCommandBaseParams {
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolveApiClient?: TripApiClient;
  setSuggestions: (updater: (current: Suggestion[]) => Suggestion[]) => void;
  trip: Trip;
}

export interface UseSuggestSelectedStopCommandParams
  extends WorkspaceSuggestionCommandBaseParams {
  canCreateSuggestion: boolean;
  currentMemberId: string;
  selectedItem: ItineraryItem | null;
}

export interface UseReviewWorkspaceSuggestionCommandParams
  extends WorkspaceSuggestionCommandBaseParams {
  canReviewSuggestions: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  suggestions: Suggestion[];
}

export type SuggestSelectedStopCommand = () => Promise<void>;

export type ReviewSuggestionCommand = (
  suggestionId: string,
  decision: SuggestionReviewDecision,
) => Promise<void>;
