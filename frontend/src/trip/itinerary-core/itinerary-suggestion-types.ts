import type { ItineraryItem } from "./itinerary-types";

export const suggestionTypeValues = ["add", "edit", "delete", "reorder"] as const;
export type SuggestionType = (typeof suggestionTypeValues)[number];

export const suggestionStatusValues = [
  "pending",
  "approved",
  "rejected",
  "conflicted",
] as const;
export type SuggestionStatus = (typeof suggestionStatusValues)[number];
export type SuggestionReviewDecision = Extract<SuggestionStatus, "approved" | "rejected">;

export type EditableSuggestionPatch = Partial<
  Pick<
    ItineraryItem,
    "day" | "startTime" | "activity" | "activityType" | "activitySubtype" | "place" | "mapLink" | "durationMinutes" | "transportation" | "note"
  >
>;

export interface Suggestion {
  id: string;
  tripId: string;
  proposerId: string;
  type: SuggestionType;
  targetItemId: string | null;
  planVariantId: string;
  proposedPatch: EditableSuggestionPatch;
  sourceVersion: number | null;
  status: SuggestionStatus;
  createdAt: string;
}
