import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { buildBookingDoc } from "@/src/features/itinerary/testing";
import { selectedContextRailItem } from "./ContextRail.test-fixtures";
import { buildContextRailSelection } from "./context-rail.state";

describe("buildContextRailSelection", () => {
  it("selects rail records linked to the active itinerary item", () => {
    const selectedItem = selectedContextRailItem;
    const linkedBookingDoc = buildBookingDoc({
      id: "booking-dimdim",
      tripId: tripFixture.trip.id,
      tripPlanId: selectedItem.planVariantId,
      type: "activity_ticket",
      title: "Dim Dim Sum reservation",
      ownerMemberId: tripFixture.currentMembers.owner.id,
      relatedItineraryItemIds: [selectedItem.id],
      createdBy: tripFixture.currentMembers.owner.id,
    });
    const unrelatedBookingDoc = buildBookingDoc({
      id: "booking-other",
      tripId: tripFixture.trip.id,
      tripPlanId: selectedItem.planVariantId,
      type: "activity_ticket",
      title: "Other stop reservation",
      ownerMemberId: tripFixture.currentMembers.owner.id,
      relatedItineraryItemIds: ["item-other"],
      createdBy: tripFixture.currentMembers.owner.id,
    });

    const selection = buildContextRailSelection({
      trip: {
        ...tripFixture.trip,
        expenses: [
          ...tripFixture.trip.expenses,
          {
            id: "expense-dimdim",
            title: "Dim sum",
            amount: 240,
            paidBy: tripFixture.currentMembers.owner.id,
            splits: {},
            category: "food",
            itineraryItemId: selectedItem.id,
            version: 1,
          },
        ],
      },
      selectedItem,
      stopNotes: tripFixture.stopNotes,
      tasks: tripFixture.tasks,
      bookingDocs: [linkedBookingDoc, unrelatedBookingDoc],
      suggestions: tripFixture.suggestions,
    });

    expect(selection.selectedNotes.map((note) => note.id)).toEqual([
      "note-dimdim-1",
    ]);
    expect(selection.selectedExpenses.map((expense) => expense.id)).toEqual([
      "expense-dimdim",
    ]);
    expect(selection.selectedTasks.map((task) => task.id)).toContain(
      "task-dimdim-booking",
    );
    expect(selection.selectedBookingDocs.map((bookingDoc) => bookingDoc.id)).toEqual(
      ["booking-dimdim"],
    );
    expect(selection.selectedSuggestions.map((suggestion) => suggestion.id)).toEqual(
      ["suggestion-rating", "suggestion-booking"],
    );
  });

  it("uses group expenses and clears item-only records when no item is selected", () => {
    const selection = buildContextRailSelection({
      trip: tripFixture.trip,
      selectedItem: undefined,
      stopNotes: tripFixture.stopNotes,
      tasks: tripFixture.tasks,
      bookingDocs: tripFixture.trip.bookingDocs ?? [],
      suggestions: tripFixture.suggestions,
    });

    expect(selection.selectedExpenses).toBe(tripFixture.trip.expenses);
    expect(selection.selectedAdvisories).toEqual([]);
    expect(selection.selectedNotes).toEqual([]);
    expect(selection.selectedTasks).toEqual([]);
    expect(selection.selectedBookingDocs).toEqual([]);
    expect(selection.selectedSuggestions).toEqual([]);
  });
});
