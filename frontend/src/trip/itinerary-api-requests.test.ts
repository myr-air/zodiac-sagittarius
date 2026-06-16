import { describe, expect, it } from "vitest";
import { buildCreateItineraryItemRequest } from "./itinerary-api-requests";
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
});
