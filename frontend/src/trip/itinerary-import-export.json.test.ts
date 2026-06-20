import { describe, expect, it } from "vitest";
import {
  buildItineraryExport,
  parseItineraryImport,
  parseItineraryImportDocument,
} from "./itinerary-import-export";
import { tripFixture } from "./trip-fixtures";
import { pathIdRain } from "./testing/itinerary-path-fixtures";

describe("itinerary import/export JSON", () => {
  it("preserves activity branch group fields in export and import", () => {
    const branchedItem = {
      ...tripFixture.planItems[0],
      id: "item-rain-alt",
      pathGroupId: "group-morning",
      pathId: pathIdRain,
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
      pathId: pathIdRain,
      pathName: "Rain plan",
      pathRole: "alternative",
    });
    expect(parseItineraryImport(JSON.stringify(payload))[0]).toMatchObject({
      pathGroupId: "group-morning",
      pathId: pathIdRain,
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
      planVariants: [],
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
