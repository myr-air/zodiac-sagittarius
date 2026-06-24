import { describe, expect, it } from "vitest";
import { buildItineraryCommitmentsByItemId } from "../../../itinerary-core";

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

  it("summarizes linked bookings, expenses, notes, and open tasks by itinerary item", () => {
    const commitments = buildItineraryCommitmentsByItemId({
      bookingDocs: [
        {
          relatedItineraryItemIds: ["item-dimdim", "item-peak"],
        },
        {
          relatedItineraryItemIds: ["item-dimdim"],
        },
      ],
      expenses: [
        { itineraryItemId: "item-dimdim" },
        { itineraryItemId: null },
      ],
      stopNotes: [
        { itemId: "item-dimdim" },
        { itemId: "item-peak" },
      ],
      tasks: [
        { relatedItemId: "item-dimdim", status: "open" },
        { relatedItemId: "item-dimdim", status: "done" },
        { relatedItemId: "item-peak", status: "open" },
      ],
    });

    expect(commitments).toEqual({
      "item-dimdim": {
        bookingCount: 2,
        expenseCount: 1,
        noteCount: 1,
        openTaskCount: 1,
      },
      "item-peak": {
        bookingCount: 1,
        noteCount: 1,
        openTaskCount: 1,
      },
    });
  });
});
