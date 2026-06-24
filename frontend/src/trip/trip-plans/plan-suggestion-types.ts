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
