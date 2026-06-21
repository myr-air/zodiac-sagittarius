import type { CreateSuggestionApiRequest } from "../api-client";
import type { ItineraryItem, Suggestion } from "../types";

export interface LocalEditSuggestionInput {
  tripId: string;
  proposerId: string;
  targetItem: Pick<ItineraryItem, "id" | "activity" | "planVariantId" | "version">;
  createdAt: string;
  nextSuggestionId: (suggestions: Suggestion[]) => string;
}

export function createLocalEditSuggestion(
  suggestions: Suggestion[],
  input: LocalEditSuggestionInput,
): Suggestion {
  return {
    id: input.nextSuggestionId(suggestions),
    tripId: input.tripId,
    proposerId: input.proposerId,
    type: "edit",
    targetItemId: input.targetItem.id,
    planVariantId: input.targetItem.planVariantId,
    proposedPatch: { activity: input.targetItem.activity },
    sourceVersion: input.targetItem.version,
    status: "pending",
    createdAt: input.createdAt,
  };
}

export function buildCreateEditSuggestionRequest(
  targetItem: Pick<ItineraryItem, "id" | "activity" | "planVariantId" | "version">,
  options: { clientMutationId: string },
): CreateSuggestionApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    type: "edit",
    targetItemId: targetItem.id,
    planVariantId: targetItem.planVariantId,
    proposedPatch: { activity: targetItem.activity },
    sourceVersion: targetItem.version,
  };
}

export function detectSuggestionConflict(items: ItineraryItem[], suggestion: Suggestion): Suggestion {
  if (suggestion.status !== "pending" || suggestion.type === "add" || !suggestion.targetItemId) return suggestion;
  const target = items.find((item) => item.id === suggestion.targetItemId && item.planVariantId === suggestion.planVariantId);
  if (!target || suggestion.sourceVersion !== target.version) return { ...suggestion, status: "conflicted" };
  return suggestion;
}

export function approveSuggestion(items: ItineraryItem[], suggestion: Suggestion): { status: "approved" | "conflicted"; suggestion: Suggestion; items: ItineraryItem[] } {
  const checked = detectSuggestionConflict(items, suggestion);
  if (checked.status === "conflicted") return { status: "conflicted", suggestion: checked, items };

  if (checked.type === "edit" && checked.targetItemId) {
    const nextItems = items.map((item) =>
      item.id === checked.targetItemId && item.planVariantId === checked.planVariantId
        ? { ...item, ...checked.proposedPatch, version: item.version + 1, updatedAt: new Date().toISOString() }
        : item,
    );
    return { status: "approved", suggestion: { ...checked, status: "approved" }, items: nextItems };
  }

  return { status: "approved", suggestion: { ...checked, status: "approved" }, items };
}

export function replaceSuggestionById(
  suggestions: Suggestion[],
  suggestionId: string,
  replacement: Suggestion,
): Suggestion[] {
  return suggestions.map((candidate) =>
    candidate.id === suggestionId ? replacement : candidate,
  );
}

export function rejectSuggestionById(
  suggestions: Suggestion[],
  suggestionId: string,
): Suggestion[] {
  return suggestions.map((suggestion) =>
    suggestion.id === suggestionId
      ? { ...suggestion, status: "rejected" }
      : suggestion,
  );
}
