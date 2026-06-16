import { describe, expect, it } from "vitest";
import {
  buildCreateItineraryItemRequest,
  buildMoveItineraryItemRequest,
  buildMoveItineraryItemToDayRequest,
  buildPatchItineraryItemRequest,
  buildReorderItineraryItemsRequest,
} from "./itinerary-api-requests";
import { seedTrip } from "./seed";

describe("itinerary API request builders", () => {
  it("builds create itinerary item requests from the draft item", () => {
    const item = {
      ...seedTrip.itineraryItems[0],
      id: "item-new",
      planVariantId: "plan-alt",
      pathGroupId: "path-group-item-new",
      pathId: "path-rain",
      pathName: "Rain plan",
      pathRole: "alternative" as const,
      parentItemId: null,
      itemKind: "activity" as const,
      timeMode: "scheduled" as const,
      status: "planned" as const,
      priority: "high" as const,
      day: "2025-05-17",
      startTime: "13:30",
      endTime: "15:00",
      endOffsetDays: 0,
      activity: "Museum visit",
      activityType: "attraction" as const,
      place: "Hong Kong Museum of History",
      mapLink: "https://maps.example/museum",
      address: "100 Chatham Road South",
      coordinates: { lat: 22.301, lng: 114.177 },
      durationMinutes: 90,
      transportation: "MTR",
      details: { ticket: "prebooked" },
      note: "Arrive early",
    };

    expect(buildCreateItineraryItemRequest(item, "mutation-1")).toEqual({
      clientMutationId: "mutation-1",
      planVariantId: "plan-alt",
      pathGroupId: "path-group-item-new",
      pathId: "path-rain",
      pathName: "Rain plan",
      pathRole: "alternative",
      parentItemId: null,
      itemKind: "activity",
      timeMode: "scheduled",
      isPlanBlock: item.isPlanBlock,
      status: "planned",
      priority: "high",
      day: "2025-05-17",
      startTime: "13:30",
      endTime: "15:00",
      endOffsetDays: 0,
      activity: "Museum visit",
      activityType: "attraction",
      activitySubtype: item.activitySubtype,
      place: "Hong Kong Museum of History",
      mapLink: "https://maps.example/museum",
      address: "100 Chatham Road South",
      coordinates: { lat: 22.301, lng: 114.177 },
      durationMinutes: 90,
      transportation: "MTR",
      details: { ticket: "prebooked" },
      note: "Arrive early",
    });
  });

  it("builds patch itinerary item requests from edit values and location fields", () => {
    expect(
      buildPatchItineraryItemRequest(
        {
          day: "2025-05-18",
          parentItemId: null,
          itemKind: "meal",
          timeMode: "scheduled",
          isPlanBlock: false,
          status: "booked",
          priority: "must",
          startTime: "19:00",
          endTime: "20:30",
          endOffsetDays: 0,
          activity: "Dinner booking",
          activityType: "food",
          place: "Temple Street",
          durationMinutes: 90,
          transportation: "Taxi",
          details: { bookingRef: "DIN-1" },
          note: "Window table",
        },
        {
          address: "Temple Street Night Market",
          clientMutationId: "mutation-2",
          coordinates: undefined,
          expectedVersion: 7,
          mapLink: "https://maps.example/temple-street",
        },
      ),
    ).toEqual({
      clientMutationId: "mutation-2",
      expectedVersion: 7,
      patch: {
        day: "2025-05-18",
        parentItemId: null,
        itemKind: "meal",
        timeMode: "scheduled",
        isPlanBlock: false,
        status: "booked",
        priority: "must",
        startTime: "19:00",
        endTime: "20:30",
        endOffsetDays: 0,
        activity: "Dinner booking",
        activityType: "food",
        place: "Temple Street",
        mapLink: "https://maps.example/temple-street",
        address: "Temple Street Night Market",
        coordinates: null,
        durationMinutes: 90,
        transportation: "Taxi",
        details: { bookingRef: "DIN-1" },
        note: "Window table",
      },
    });
  });

  it("builds move itinerary item patch requests", () => {
    expect(
      buildMoveItineraryItemRequest(
        {
          day: "2025-05-18",
          parentItemId: "plan-block-1",
          sortOrder: 250,
        },
        {
          clientMutationId: "mutation-3",
          expectedVersion: 4,
        },
      ),
    ).toEqual({
      clientMutationId: "mutation-3",
      expectedVersion: 4,
      patch: {
        day: "2025-05-18",
        parentItemId: "plan-block-1",
        sortOrder: 250,
      },
    });
  });

  it("builds move itinerary item to day patch requests", () => {
    expect(
      buildMoveItineraryItemToDayRequest({
        clientMutationId: "mutation-5",
        expectedVersion: 9,
        targetDay: "2025-05-19",
      }),
    ).toEqual({
      clientMutationId: "mutation-5",
      expectedVersion: 9,
      patch: {
        day: "2025-05-19",
        parentItemId: null,
      },
    });
  });

  it("builds reorder itinerary item requests from sorted day items", () => {
    expect(
      buildReorderItineraryItemsRequest(
        [
          {
            id: "later",
            sortOrder: 200,
            startTime: "09:00",
          },
          {
            id: "earlier",
            sortOrder: 100,
            startTime: "11:00",
          },
          {
            id: "tie-breaker",
            sortOrder: 200,
            startTime: "08:30",
          },
        ],
        {
          clientMutationId: "mutation-4",
          day: "2025-05-18",
          planVariantId: "plan-main",
        },
      ),
    ).toEqual({
      clientMutationId: "mutation-4",
      planVariantId: "plan-main",
      day: "2025-05-18",
      itemIds: ["earlier", "tie-breaker", "later"],
    });
  });
});
