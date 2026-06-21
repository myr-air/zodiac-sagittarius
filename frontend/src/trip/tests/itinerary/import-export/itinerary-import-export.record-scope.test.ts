import { describe, expect, it } from "vitest";
import {
  buildItineraryExport,
  parseItineraryImport,
  parseItineraryImportDocument,
} from "../../../itinerary-import-export";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";

describe("itinerary import/export record scoping", () => {
  it("preserves plan-scoped records in export and import documents", () => {
    const planId = tripFixture.trip.activePlanVariantId;
    const exported = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: tripFixture.planItems,
      stopNotes: tripFixture.stopNotes.map((note) => ({ ...note, tripPlanId: planId })),
      tasks: tripFixture.tasks.map((task) => ({ ...task, tripPlanId: planId })),
      trip: {
        ...tripFixture.trip,
        expenses: tripFixture.trip.expenses.map((expense) => ({
          ...expense,
          tripId: tripFixture.trip.id,
          tripPlanId: planId,
        })),
        bookingDocs: (tripFixture.trip.bookingDocs ?? []).map((booking) => ({
          ...booking,
          tripPlanId: planId,
        })),
      },
    });

    expect(exported.records).toEqual({
      expenses: tripFixture.trip.expenses.map((expense) => ({
        ...expense,
        tripId: tripFixture.trip.id,
        tripPlanId: planId,
      })),
      bookingDocs: (tripFixture.trip.bookingDocs ?? []).map((booking) => ({
        ...booking,
        tripPlanId: planId,
      })),
      stopNotes: tripFixture.stopNotes.map((note) => ({ ...note, tripPlanId: planId })),
      tasks: tripFixture.tasks.map((task) => ({ ...task, tripPlanId: planId })),
    });
    expect(parseItineraryImportDocument(JSON.stringify(exported)).records).toEqual(exported.records);
    expect(parseItineraryImport(JSON.stringify(exported))).toHaveLength(exported.items.length);
  });

  it("keeps unlinked records scoped to the exported Trip Plan instead of the current Main Plan", () => {
    const backupPlanId = "plan-backup-export";
    const backupItem = {
      ...tripFixture.planItems[0],
      id: "backup-plan-stop",
      planVariantId: backupPlanId,
      activity: "Backup plan stop",
    };
    const mainPlanExpense = {
      ...tripFixture.trip.expenses[0],
      id: "main-plan-expense",
      tripId: tripFixture.trip.id,
      tripPlanId: tripFixture.trip.activePlanVariantId,
      itineraryItemId: null,
      title: "Main plan only receipt",
    };
    const backupPlanExpense = {
      ...tripFixture.trip.expenses[0],
      id: "backup-plan-expense",
      tripId: tripFixture.trip.id,
      tripPlanId: backupPlanId,
      itineraryItemId: null,
      title: "Backup plan estimate",
    };

    const exported = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [backupItem],
      trip: {
        ...tripFixture.trip,
        expenses: [mainPlanExpense, backupPlanExpense],
      },
    });

    expect(exported.records?.expenses.map((expense) => expense.id)).toEqual([
      "backup-plan-expense",
    ]);
  });
});
