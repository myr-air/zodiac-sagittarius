import { describe, expect, it } from "vitest";
import {
  buildItineraryExport,
  parseItineraryImport,
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
      },
      items: tripFixture.planItems.map((item) => ({
        id: item.id,
        day: item.day,
        sortOrder: item.sortOrder,
        startTime: item.startTime,
        activity: item.activity,
        activityType: item.activityType,
        place: item.place,
        linkLabel: item.linkLabel,
        mapLink: item.mapLink,
        coordinates: item.coordinates,
        address: item.address,
        durationMinutes: item.durationMinutes,
        transportation: item.transportation,
        advisories: item.advisories,
        note: item.note,
      })),
    });
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

  it("parses JSON v1 imports and rejects unsupported files", () => {
    const payload = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [tripFixture.planItems[0]],
      trip: tripFixture.trip,
    });

    expect(parseItineraryImport(JSON.stringify(payload))).toEqual([
      payload.items[0],
    ]);
    expect(() => parseItineraryImport("{}")).toThrow(
      /unsupported itinerary import/i,
    );
    expect(() => parseItineraryImport("{")).toThrow(/valid JSON/i);
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
