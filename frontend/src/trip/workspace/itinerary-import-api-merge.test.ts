import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type { Expense, ItineraryItem } from "@/src/trip/types";
import { mergeApiImportedPlanRecordsIntoTrip } from "./itinerary-import-model";

describe("API-created itinerary import merges", () => {
  it("merges API-created import items and linked records into the current trip", () => {
    const deletedItem = tripFixture.trip.itineraryItems[0];
    const createdItem: ItineraryItem = {
      ...deletedItem,
      id: "item-created-import",
      activity: "Created import activity",
      version: 2,
    };
    const existingExpense = tripFixture.trip.expenses[0];
    const createdExpense: Expense = {
      ...existingExpense,
      id: "expense-created-import",
      title: "Created import expense",
    };
    const nextTrip = mergeApiImportedPlanRecordsIntoTrip({
      createdItems: [createdItem],
      currentTrip: tripFixture.trip,
      deletedItemIds: new Set([deletedItem.id]),
      previewTrip: {
        itineraryPaths: [
          ...(tripFixture.trip.itineraryPaths ?? []),
          {
            id: "path-import",
            tripId: tripFixture.trip.id,
            name: "Plan Import",
            scope: "day",
            day: createdItem.day,
            createdBy: "member-aom",
            createdAt: "2026-06-16T00:00:00.000Z",
            updatedAt: "2026-06-16T00:00:00.000Z",
          },
        ],
      },
      records: {
        bookingDocs: [],
        expenses: [createdExpense],
        stopNotes: [],
        tasks: [],
      },
    });

    expect(nextTrip).not.toBe(tripFixture.trip);
    expect(nextTrip.itineraryItems.some((item) => item.id === deletedItem.id)).toBe(false);
    expect(nextTrip.itineraryItems.at(-1)).toMatchObject({
      id: "item-created-import",
      activity: "Created import activity",
    });
    expect(nextTrip.itineraryPaths?.some((path) => path.id === "path-import")).toBe(true);
    expect(nextTrip.expenses.find((expense) => expense.id === createdExpense.id)).toMatchObject({
      title: "Created import expense",
    });
  });
});
