import { describe, expect, it } from "vitest";
import {
  buildItineraryExport,
  parseItineraryImport,
  parseItineraryImportDocument,
} from "./itinerary-import-export";
import { tripFixture } from "./trip-fixtures";

describe("itinerary import/export records", () => {
  it("exports active itinerary items in a stable JSON v1 envelope", () => {
    const exported = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: tripFixture.planItems,
      trip: tripFixture.trip,
    });

    expect(exported).toEqual({
      schema: "joii.itinerary.export",
      version: 1,
      exportedAt: "2026-06-04T12:00:00.000Z",
      trip: {
        id: tripFixture.trip.id,
        name: tripFixture.trip.name,
        destinationLabel: tripFixture.trip.destinationLabel,
        startDate: tripFixture.trip.startDate,
        endDate: tripFixture.trip.endDate,
        activePlanVariantId: tripFixture.trip.activePlanVariantId,
        mainTripPlanId: tripFixture.trip.mainTripPlanId,
        planVariants: tripFixture.trip.tripPlans ?? tripFixture.trip.planVariants,
        tripPlans: tripFixture.trip.tripPlans ?? tripFixture.trip.planVariants,
        partySize: tripFixture.trip.partySize,
        defaultTimezone: tripFixture.trip.defaultTimezone,
      },
      items: tripFixture.planItems.map((item) => ({
        id: item.id,
        pathGroupId: item.pathGroupId,
        pathId: item.pathId,
        pathName: item.pathName,
        pathRole: item.pathRole,
        itemKind: item.itemKind,
        timeMode: item.timeMode,
        parentItemId: item.parentItemId ?? null,
        isPlanBlock: item.isPlanBlock,
        status: item.status,
        priority: item.priority,
        day: item.day,
        sortOrder: item.sortOrder,
        startTime: item.startTime,
        endTime: item.endTime ?? null,
        endOffsetDays: item.endOffsetDays ?? 0,
        activity: item.activity,
        activityType: item.activityType,
        activitySubtype: item.activitySubtype ?? null,
        place: item.place,
        linkLabel: item.linkLabel,
        mapLink: item.mapLink,
        coordinates: item.coordinates,
        address: item.address,
        durationMinutes: item.durationMinutes,
        transportation: item.transportation,
        details: item.details ?? {},
        advisories: item.advisories,
        note: item.note,
      })),
      records: {
        expenses: tripFixture.trip.expenses,
        bookingDocs: tripFixture.trip.bookingDocs,
        stopNotes: [],
        tasks: [],
      },
    });
  });

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

  it("preserves actual expense and paid booking records as source references without remapping ids", () => {
    const selectedPlanId = "plan-client-draft";
    const selectedItem = {
      ...tripFixture.planItems[0],
      id: "draft-flight-window",
      planVariantId: selectedPlanId,
    };
    const paidExpense = {
      ...tripFixture.trip.expenses[0],
      id: "expense-paid-source",
      tripId: tripFixture.trip.id,
      tripPlanId: selectedPlanId,
      itineraryItemId: selectedItem.id,
      title: "Paid source ticket",
      amount: 4200,
      amountMinor: 420000,
      currency: "THB",
      version: 9,
    };
    const paidBooking = {
      ...(tripFixture.trip.bookingDocs ?? [])[0],
      id: "booking-paid-source",
      tripId: tripFixture.trip.id,
      tripPlanId: selectedPlanId,
      title: "Paid source flight booking",
      status: "paid" as const,
      relatedItineraryItemIds: [selectedItem.id],
      relatedExpenseIds: [paidExpense.id],
      version: 4,
    };

    const exported = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [selectedItem],
      trip: {
        ...tripFixture.trip,
        activePlanVariantId: tripFixture.trip.activePlanVariantId,
        mainTripPlanId: tripFixture.trip.activePlanVariantId,
        expenses: [paidExpense],
        bookingDocs: [paidBooking],
      },
    });
    const parsed = parseItineraryImportDocument(JSON.stringify(exported));

    expect(parsed.trip.mainTripPlanId).toBe(tripFixture.trip.activePlanVariantId);
    expect(parsed.records?.expenses).toEqual([paidExpense]);
    expect(parsed.records?.bookingDocs).toEqual([paidBooking]);
    expect(parsed.records?.bookingDocs[0]).toMatchObject({
      id: "booking-paid-source",
      status: "paid",
      relatedExpenseIds: ["expense-paid-source"],
      relatedItineraryItemIds: ["draft-flight-window"],
      tripPlanId: selectedPlanId,
    });
  });
});
