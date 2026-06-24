import { describe, expect, it } from "vitest";
import {
  buildCreateEditSuggestionRequest,
  createLocalEditSuggestion,
} from "../../itinerary-core";
import { buildTripFixtureSuggestion } from "../../testing/fixtures/trip-fixtures";
import type { ItineraryItem } from "../../types";

describe("suggestion helpers", () => {
  it("builds API create requests for edit suggestions", () => {
    expect(
      buildCreateEditSuggestionRequest(itemFixture(), {
        clientMutationId: "mutation-suggestion-create",
      }),
    ).toEqual({
      clientMutationId: "mutation-suggestion-create",
      type: "edit",
      targetItemId: "item-peak",
      planVariantId: "plan-main",
      proposedPatch: { activity: "Victoria Peak" },
      sourceVersion: 5,
    });
  });

  it("builds local edit suggestions from app-provided context", () => {
    expect(
      createLocalEditSuggestion([buildTripFixtureSuggestion({ id: "suggestion-1" })], {
        tripId: "trip-1",
        proposerId: "member-aom",
        targetItem: itemFixture(),
        createdAt: "2026-06-18T10:00:00.000Z",
        nextSuggestionId: (suggestions) =>
          `suggestion-local-${suggestions.length + 1}`,
      }),
    ).toEqual({
      id: "suggestion-local-2",
      tripId: "trip-1",
      proposerId: "member-aom",
      type: "edit",
      targetItemId: "item-peak",
      planVariantId: "plan-main",
      proposedPatch: { activity: "Victoria Peak" },
      sourceVersion: 5,
      status: "pending",
      createdAt: "2026-06-18T10:00:00.000Z",
    });
  });
});

function itemFixture(): Pick<
  ItineraryItem,
  "id" | "activity" | "planVariantId" | "version"
> {
  return {
    id: "item-peak",
    activity: "Victoria Peak",
    planVariantId: "plan-main",
    version: 5,
  };
}
