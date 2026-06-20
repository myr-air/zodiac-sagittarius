import { describe, expect, it } from "vitest";
import { buildItineraryExport } from "./itinerary-import-export";
import { tripFixture } from "./trip-fixtures";

describe("itinerary import/export envelope", () => {
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
});
