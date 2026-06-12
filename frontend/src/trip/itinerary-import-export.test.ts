import { describe, expect, it } from "vitest";
import {
  buildItineraryExport,
  parseItineraryImport,
  parseItineraryImportDocument,
} from "./itinerary-import-export";
import { tripFixture } from "./trip-fixtures";

describe("itinerary import/export JSON", () => {
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
        tripPlans: tripFixture.trip.tripPlans ?? tripFixture.trip.planVariants,
        partySize: tripFixture.trip.partySize,
        defaultTimezone: tripFixture.trip.defaultTimezone,
      },
      items: tripFixture.planItems.map((item) => ({
        id: item.id,
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

  it("preserves Trip Plan metadata in export and import documents", () => {
    const tripPlans = [
      {
        ...tripFixture.trip.planVariants[0],
        kind: "main" as const,
        status: "main" as const,
        description: "Current usable plan",
        version: 7,
      },
      {
        id: "plan-client-proposal",
        tripId: tripFixture.trip.id,
        name: "Client proposal",
        kind: "draft" as const,
        status: "proposal" as const,
        description: "Presented to tour guests",
        version: 2,
      },
    ];

    const exported = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [tripFixture.planItems[0]],
      trip: {
        ...tripFixture.trip,
        activePlanVariantId: tripPlans[1].id,
        mainTripPlanId: tripPlans[0].id,
        planVariants: tripPlans,
        tripPlans,
      },
    });

    expect(exported.trip).toMatchObject({
      activePlanVariantId: "plan-client-proposal",
      mainTripPlanId: tripPlans[0].id,
      tripPlans,
    });
    expect(parseItineraryImportDocument(JSON.stringify(exported)).trip).toMatchObject({
      activePlanVariantId: "plan-client-proposal",
      mainTripPlanId: tripPlans[0].id,
      tripPlans,
    });
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

  it("preserves activity branch group fields in export and import", () => {
    const branchedItem = {
      ...tripFixture.planItems[0],
      id: "item-rain-alt",
      pathGroupId: "group-morning",
      pathId: "path-rain",
      pathName: "Rain plan",
      pathRole: "alternative" as const,
    };

    const payload = buildItineraryExport({
      exportedAt: "2026-06-04T00:00:00.000Z",
      items: [branchedItem],
      trip: tripFixture.trip,
    });

    expect(payload.items[0]).toMatchObject({
      id: "item-rain-alt",
      pathGroupId: "group-morning",
      pathId: "path-rain",
      pathName: "Rain plan",
      pathRole: "alternative",
    });
    expect(parseItineraryImport(JSON.stringify(payload))[0]).toMatchObject({
      pathGroupId: "group-morning",
      pathId: "path-rain",
      pathName: "Rain plan",
      pathRole: "alternative",
    });
  });

  it("preserves structured itinerary details in export and import", () => {
    const itemWithDetails = {
      ...tripFixture.planItems[0],
      activityType: "travel" as const,
      details: {
        kind: "transportation",
        origin: "Shenzhen",
        destination: "Hong Kong",
        mode: "Train",
        ticketRef: "G5607",
      },
    };

    const payload = buildItineraryExport({
      exportedAt: "2026-06-04T00:00:00.000Z",
      items: [itemWithDetails],
      trip: tripFixture.trip,
    });

    expect(payload.items[0].details).toEqual({
      kind: "transportation",
      origin: "Shenzhen",
      destination: "Hong Kong",
      mode: "Train",
      ticketRef: "G5607",
    });
    expect(parseItineraryImport(JSON.stringify(payload))[0].details).toEqual(payload.items[0].details);
  });

  it("preserves V1 hierarchy and flexible item fields in export and import", () => {
    const flexibleChild = {
      ...tripFixture.planItems[0],
      id: "food-rec-1",
      itemKind: "foodRecommendation" as const,
      timeMode: "flexible" as const,
      parentItemId: "block-1",
      isPlanBlock: false,
      status: "idea" as const,
      priority: "high" as const,
      startTime: "",
      endTime: null,
      endOffsetDays: 0,
      durationMinutes: null,
      details: {
        sourceLink: "https://example.test/noodles",
        cuisine: "Cantonese",
      },
    };

    const payload = buildItineraryExport({
      exportedAt: "2026-06-04T00:00:00.000Z",
      items: [flexibleChild],
      trip: tripFixture.trip,
    });

    expect(payload.items[0]).toMatchObject({
      itemKind: "foodRecommendation",
      timeMode: "flexible",
      parentItemId: "block-1",
      isPlanBlock: false,
      status: "idea",
      priority: "high",
      startTime: "",
      endTime: null,
      endOffsetDays: 0,
      durationMinutes: null,
    });
    expect(parseItineraryImport(JSON.stringify(payload))[0]).toMatchObject({
      itemKind: "foodRecommendation",
      timeMode: "flexible",
      parentItemId: "block-1",
      isPlanBlock: false,
      status: "idea",
      priority: "high",
      startTime: "",
      endTime: null,
      endOffsetDays: 0,
      durationMinutes: null,
    });
  });

  it("preserves optional time windows with cross-day endings in export and import", () => {
    const overnightItem = {
      ...tripFixture.planItems[0],
      id: "item-overnight-flight",
      startTime: "23:00",
      endTime: "02:00",
      endOffsetDays: 1,
      durationMinutes: 180,
    };

    const payload = buildItineraryExport({
      exportedAt: "2026-06-04T00:00:00.000Z",
      items: [overnightItem],
      trip: tripFixture.trip,
    });

    expect(payload.items[0]).toMatchObject({
      startTime: "23:00",
      endTime: "02:00",
      endOffsetDays: 1,
    });
    expect(parseItineraryImport(JSON.stringify(payload))[0]).toMatchObject({
      startTime: "23:00",
      endTime: "02:00",
      endOffsetDays: 1,
    });
  });

  it("parses JSON v1 imports and rejects unsupported files", () => {
    const payload = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [tripFixture.planItems[0]],
      trip: tripFixture.trip,
    });

    expect(parseItineraryImport(JSON.stringify(payload))[0]).toMatchObject({
      ...payload.items[0],
      itemKind: "travel",
      timeMode: "scheduled",
      parentItemId: null,
      isPlanBlock: false,
      status: "planned",
      priority: "normal",
    });
    expect(() => parseItineraryImport("{}")).toThrow(
      /unsupported itinerary import/i,
    );
    expect(() => parseItineraryImport("{")).toThrow(/valid JSON/i);
  });

  it("accepts compatibility imports without source trip metadata", () => {
    const payload = {
      schema: "joii.itinerary.export",
      version: 1,
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [tripFixture.planItems[0]],
    };

    const document = parseItineraryImportDocument(JSON.stringify(payload));

    expect(document.trip).toMatchObject({
      id: "",
      activePlanVariantId: "",
      mainTripPlanId: undefined,
      tripPlans: [],
    });
    expect(document.records).toEqual({
      expenses: [],
      bookingDocs: [],
      stopNotes: [],
      tasks: [],
    });
  });

  it("drops unsafe map links from imported itinerary items", () => {
    const payload = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [
        {
          ...tripFixture.planItems[0],
          mapLink: "javascript:alert(document.domain)",
        },
      ],
      trip: tripFixture.trip,
    });

    expect(parseItineraryImport(JSON.stringify(payload))[0].mapLink).toBe("");
  });
});
