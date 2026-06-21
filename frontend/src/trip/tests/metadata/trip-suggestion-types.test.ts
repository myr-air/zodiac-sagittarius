import { describe, expect, it } from "vitest";
import {
  planSuggestionActionKindValues,
  planSuggestionScopeValues,
  planSuggestionSeverityValues,
  planSuggestionStatusValues,
  suggestionStatusValues,
  suggestionTypeValues,
} from "../../trip-suggestion-types";

describe("trip suggestion type values", () => {
  it("keeps suggestion enum values in canonical order", () => {
    expect(suggestionTypeValues).toEqual(["add", "edit", "delete", "reorder"]);
    expect(suggestionStatusValues).toEqual([
      "pending",
      "approved",
      "rejected",
      "conflicted",
    ]);
    expect(planSuggestionSeverityValues).toEqual(["info", "warning", "critical"]);
    expect(planSuggestionScopeValues).toEqual(["item", "betweenItems", "day", "trip"]);
    expect(planSuggestionStatusValues).toEqual([
      "pending",
      "accepted",
      "dismissed",
      "snoozed",
    ]);
    expect(planSuggestionActionKindValues).toEqual([
      "accept",
      "dismiss",
      "snooze",
      "convertToItem",
      "editItem",
    ]);
  });
});
