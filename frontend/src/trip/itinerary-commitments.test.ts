import { describe, expect, it } from "vitest";
import { buildItineraryCommitmentsByItemId } from "./itinerary-commitments";

describe("itinerary commitments", () => {
  it("aggregates linked booking, expense, note, and open task counts by item", () => {
    expect(
      buildItineraryCommitmentsByItemId({
        bookingDocs: [
          { relatedItineraryItemIds: ["item-a", "item-b"] },
          { relatedItineraryItemIds: ["item-a"] },
        ],
        expenses: [
          { itineraryItemId: "item-a" },
          { itineraryItemId: null },
          { itineraryItemId: "item-b" },
        ],
        stopNotes: [{ itemId: "item-a" }],
        tasks: [
          { relatedItemId: "item-a", status: "open" },
          { relatedItemId: "item-a", status: "done" },
          { relatedItemId: "item-b", status: "open" },
        ],
      }),
    ).toEqual({
      "item-a": {
        bookingCount: 2,
        expenseCount: 1,
        noteCount: 1,
        openTaskCount: 1,
      },
      "item-b": {
        bookingCount: 1,
        expenseCount: 1,
        openTaskCount: 1,
      },
    });
  });
});
