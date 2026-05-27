import type { ItineraryItem, Suggestion } from "./types";

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
