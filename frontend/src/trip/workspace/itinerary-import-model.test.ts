import { describe, expect, it } from "vitest";
import {
  buildImportedPlanRecordsForTripPlan,
  emptyItineraryExportRecords,
  mergeImportedRecordsIntoTripPlan,
  pendingItineraryImportFromDocument,
  shouldUseApiItineraryImport,
} from "./itinerary-import-model";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type { Expense, ItineraryItem, StopNote, TripTask } from "@/src/trip/types";

describe("itinerary import model", () => {
  it("keeps spreadsheet-like imports local and sends structured JSON through the API", () => {
    expect(
      shouldUseApiItineraryImport({
        contentType: "application/json",
        fileName: "trip-itinerary.json",
      }),
    ).toBe(true);
    expect(
      shouldUseApiItineraryImport({
        contentType: "text/csv",
        fileName: "trip-itinerary.csv",
      }),
    ).toBe(false);
    expect(
      shouldUseApiItineraryImport({
        contentType: "text/plain",
        fileName: "paste.tsv",
      }),
    ).toBe(false);
  });

  it("normalizes pending imports with empty linked records by default", () => {
    expect(
      pendingItineraryImportFromDocument({
        fileName: "trip-itinerary.json",
        document: {
          items: [],
        },
      }),
    ).toEqual({
      fileName: "trip-itinerary.json",
      items: [],
      records: emptyItineraryExportRecords(),
    });
  });

  it("remaps imported linked records to the applied activity ids", () => {
    const importedItem = {
      activity: "Museum",
      activityType: "attraction" as const,
      day: "2026-06-19",
      details: {},
      durationMinutes: 60,
      id: "import-museum",
      linkLabel: "",
      mapLink: "",
      note: "",
      place: "Central",
      sortOrder: 100,
      startTime: "10:00",
      transportation: "",
    };
    const appliedItem: ItineraryItem = {
      ...importedItem,
      createdBy: "member-aom",
      id: "item-created-museum",
      planVariantId: "plan-rain",
      tripId: tripFixture.trip.id,
      updatedAt: "2026-06-16T00:00:00.000Z",
      version: 1,
    };
    const importedExpense: Expense = {
      amount: 12,
      amountMinor: 1200,
      category: "tickets",
      comments: [],
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      id: "expense-import",
      itineraryItemId: importedItem.id,
      paidBy: "member-aom",
      splits: {},
      title: "Museum ticket",
      tripId: "source-trip",
      tripPlanId: "source-plan",
    };
    const importedNote: StopNote = {
      body: "Use exit C",
      authorId: "member-aom",
      createdAt: "2026-06-16T00:00:00.000Z",
      id: "note-import",
      itemId: importedItem.id,
      tripId: "source-trip",
      tripPlanId: "source-plan",
    };
    const importedTask: TripTask = {
      assigneeId: "member-aom",
      id: "task-import",
      createdBy: "member-aom",
      kind: "booking",
      relatedItemId: importedItem.id,
      status: "open",
      title: "Buy tickets",
      tripPlanId: "source-plan",
      visibility: "shared",
    };

    const records = buildImportedPlanRecordsForTripPlan({
      appliedImportedItems: [appliedItem],
      importedItems: [importedItem],
      records: {
        bookingDocs: [],
        expenses: [importedExpense],
        stopNotes: [importedNote],
        tasks: [importedTask],
      },
      targetTrip: tripFixture.trip,
      tripPlanId: "plan-rain",
    });

    expect(records.expenses[0]).toMatchObject({
      itineraryItemId: "item-created-museum",
      tripId: tripFixture.trip.id,
      tripPlanId: "plan-rain",
    });
    expect(records.stopNotes[0]).toMatchObject({
      itemId: "item-created-museum",
      tripId: tripFixture.trip.id,
      tripPlanId: "plan-rain",
    });
    expect(records.tasks[0]).toMatchObject({
      relatedItemId: "item-created-museum",
      tripPlanId: "plan-rain",
    });

    const mergedTrip = mergeImportedRecordsIntoTripPlan(
      tripFixture.trip,
      records,
    );
    expect(mergedTrip.expenses.find((expense) => expense.id === "expense-import")).toBeDefined();
    expect(mergedTrip.stopNotes?.find((note) => note.id === "note-import")).toBeDefined();
    expect(mergedTrip.tasks?.find((task) => task.id === "task-import")).toBeDefined();
  });
});
