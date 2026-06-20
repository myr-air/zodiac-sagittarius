import type { ItineraryItem } from "./trip-itinerary-types";

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

export interface LocalizedText {
  en: string;
  th: string;
}

export const planSuggestionSeverityValues = ["info", "warning", "critical"] as const;
export type PlanSuggestionSeverity = (typeof planSuggestionSeverityValues)[number];

export const planSuggestionScopeValues = ["item", "betweenItems", "day", "trip"] as const;
export type PlanSuggestionScope = (typeof planSuggestionScopeValues)[number];

export const planSuggestionStatusValues = [
  "pending",
  "accepted",
  "dismissed",
  "snoozed",
] as const;
export type PlanSuggestionStatus = (typeof planSuggestionStatusValues)[number];

export const planSuggestionActionKindValues = [
  "accept",
  "dismiss",
  "snooze",
  "convertToItem",
  "editItem",
] as const;
export type PlanSuggestionActionKind = (typeof planSuggestionActionKindValues)[number];

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
