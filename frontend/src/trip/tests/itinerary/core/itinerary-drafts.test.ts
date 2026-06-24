import { describe, expect, it } from "vitest";
import { seedTrip } from "../../../seed";
import {
  buildItineraryItemDraft,
  buildUpdatedItineraryItem,
} from "../../../itinerary-core";
import {
  mainItineraryPathId,
} from "../../../itinerary-paths";
import {
  pathIdRainDay,
  pathNameRainDay,
} from "@/src/trip/testing/fixtures/itinerary-path-fixtures";
import { getTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";

describe("itinerary draft builders", () => {
  it("builds new itinerary item drafts with target path fields", () => {
    const nextItem = buildItineraryItemDraft(
      {
        activity: "Museum",
        activityType: "attraction",
        day: "2026-06-19",
        details: { ticket: "onsite" },
        durationMinutes: 90,
        endOffsetDays: 0,
        endTime: null,
        isPlanBlock: false,
        itemKind: "activity",
        note: "Buy ticket",
        parentItemId: null,
        place: "Central",
        priority: "normal",
        startTime: "10:00",
        status: "planned",
        timeMode: "scheduled",
        transportation: "MTR",
      },
      {
        address: "Central, Hong Kong",
        coordinates: { lat: 22.281, lng: 114.159 },
        createdBy: "member-aom",
        mapLink: "https://maps.example/museum",
        nextItemId: "item-local-1",
        pathId: pathIdRainDay,
        pathName: pathNameRainDay,
        planItems: seedTrip.itineraryItems,
        selectedTripPlanId: seedTrip.activePlanVariantId,
        trip: seedTrip,
        updatedAt: "2026-06-16T00:00:00.000Z",
      },
    );

    expect(nextItem).toMatchObject({
      id: "item-local-1",
      tripId: seedTrip.id,
      planVariantId: seedTrip.activePlanVariantId,
      pathGroupId: "path-group-item-local-1",
      pathId: pathIdRainDay,
      pathName: pathNameRainDay,
      pathRole: "alternative",
      parentItemId: null,
      linkLabel: "แผนที่",
      mapLink: "https://maps.example/museum",
      address: "Central, Hong Kong",
      createdBy: "member-aom",
      updatedAt: "2026-06-16T00:00:00.000Z",
      version: 1,
    });
    expect(nextItem.sortOrder).toBeGreaterThan(0);
  });

  it("builds child itinerary item drafts by inheriting the parent path", () => {
    const baseParentItem = getTripFixtureItineraryItem("item-dimdim");
    const parentItem = {
      ...baseParentItem,
      pathGroupId: "path-group-parent",
      pathId: "path-parent",
      pathName: "Parent path",
      pathRole: "alternative" as const,
    };
    const trip = {
      ...seedTrip,
      itineraryItems: seedTrip.itineraryItems.map((item) =>
        item.id === parentItem.id ? parentItem : item,
      ),
    };
    const child = buildItineraryItemDraft(
      {
        activity: "Coffee stop",
        activityType: "food",
        day: parentItem.day,
        details: {},
        durationMinutes: 30,
        endOffsetDays: 0,
        endTime: null,
        isPlanBlock: false,
        itemKind: "meal",
        note: "",
        parentItemId: parentItem.id,
        place: "Cafe",
        priority: "normal",
        startTime: "11:00",
        status: "planned",
        timeMode: "scheduled",
        transportation: "walk",
      },
      {
        address: "Cafe address",
        coordinates: undefined,
        createdBy: "member-aom",
        mapLink: "https://maps.example/cafe",
        nextItemId: "item-child",
        pathId: mainItineraryPathId,
        planItems: trip.itineraryItems,
        selectedTripPlanId: seedTrip.activePlanVariantId,
        trip,
        updatedAt: "2026-06-16T00:00:00.000Z",
      },
    );

    expect(child).toMatchObject({
      id: "item-child",
      parentItemId: parentItem.id,
      pathGroupId: "path-group-parent",
      pathId: "path-parent",
      pathName: "Parent path",
      pathRole: "alternative",
      planVariantId: parentItem.planVariantId,
    });
    expect(child.sortOrder).toBe(parentItem.sortOrder + 10);
  });

  it("builds updated itinerary items from local edit values", () => {
    const item = getTripFixtureItineraryItem("item-dimdim");
    const updated = buildUpdatedItineraryItem(
      item,
      {
        activity: "Updated local activity",
        activityType: "food",
        day: "2026-06-20",
        details: { reservationName: "Aom" },
        durationMinutes: 45,
        endOffsetDays: 1,
        endTime: "12:30",
        isPlanBlock: false,
        itemKind: "meal",
        note: "Updated note",
        parentItemId: null,
        place: "Updated place",
        priority: "high",
        startTime: "11:45",
        status: "booked",
        timeMode: "scheduled",
        transportation: "walk",
      },
      {
        address: "Updated address",
        coordinates: { lat: 22.3, lng: 114.2 },
        mapLink: "https://maps.example/updated",
        updatedAt: "2026-06-16T00:00:00.000Z",
      },
    );

    expect(updated).toMatchObject({
      id: item.id,
      tripId: item.tripId,
      day: "2026-06-20",
      parentItemId: null,
      itemKind: "meal",
      activity: "Updated local activity",
      activityType: "food",
      place: "Updated place",
      mapLink: "https://maps.example/updated",
      address: "Updated address",
      coordinates: { lat: 22.3, lng: 114.2 },
      durationMinutes: 45,
      transportation: "walk",
      details: { reservationName: "Aom" },
      note: "Updated note",
      updatedAt: "2026-06-16T00:00:00.000Z",
      version: item.version + 1,
    });
  });
});
