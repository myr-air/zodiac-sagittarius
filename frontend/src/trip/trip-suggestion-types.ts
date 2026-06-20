import type { ItineraryItem } from "./trip-itinerary-types";

export type SuggestionType = "add" | "edit" | "delete" | "reorder";
export type SuggestionStatus = "pending" | "approved" | "rejected" | "conflicted";

export interface LocalizedText {
  en: string;
  th: string;
}

export type PlanSuggestionSeverity = "info" | "warning" | "critical";
export type PlanSuggestionScope = "item" | "betweenItems" | "day" | "trip";
export type PlanSuggestionStatus = "pending" | "accepted" | "dismissed" | "snoozed";
export type PlanSuggestionActionKind = "accept" | "dismiss" | "snooze" | "convertToItem" | "editItem";

export interface PlanSuggestion {
  id: string;
  tripId: string;
  planCheckId: string;
  severity: PlanSuggestionSeverity;
  scope: PlanSuggestionScope;
  targetItemIds: string[];
  explanation: LocalizedText;
  recommendedAction: LocalizedText;
  actionKind?: PlanSuggestionActionKind | null;
  actionPayload: Record<string, unknown>;
  status: PlanSuggestionStatus;
  snoozedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PlanCheck {
  id: string;
  tripId: string;
  tripPlanId?: string | null;
  createdBy: string;
  itineraryFingerprint: string;
  stale: boolean;
  status: "running" | "complete" | "failed";
  languageMetadata: Record<string, unknown>;
  createdAt: string;
  completedAt?: string | null;
  version: number;
  suggestions: PlanSuggestion[];
}

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
