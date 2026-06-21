import { describe, expect, it } from "vitest";
import {
  buildItineraryExport,
  parseItineraryImport,
} from "../../../itinerary-import-export";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";

describe("itinerary import/export hierarchy", () => {
  it("preserves V1 hierarchy and flexible item fields in export and import", () => {
    const block = {
      ...tripFixture.planItems[0],
      id: "block-1",
      isPlanBlock: false,
      parentItemId: null,
    };
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
      items: [block, flexibleChild],
      trip: tripFixture.trip,
    });

    expect(payload.items[1]).toMatchObject({
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
      id: "block-1",
      isPlanBlock: true,
      parentItemId: null,
    });
    expect(parseItineraryImport(JSON.stringify(payload))[1]).toMatchObject({
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

  it("rejects imported grandchild or cross-day hierarchy", () => {
    const block = {
      ...tripFixture.planItems[0],
      id: "block-1",
      day: "2026-06-19",
      parentItemId: null,
      isPlanBlock: true,
    };
    const child = {
      ...tripFixture.planItems[1],
      id: "child-1",
      day: "2026-06-19",
      parentItemId: "block-1",
      isPlanBlock: false,
    };
    const grandchildPayload = buildItineraryExport({
      exportedAt: "2026-06-04T00:00:00.000Z",
      items: [
        block,
        child,
        {
          ...tripFixture.planItems[2],
          id: "grandchild-1",
          day: "2026-06-19",
          parentItemId: "child-1",
          isPlanBlock: false,
        },
      ],
      trip: tripFixture.trip,
    });
    const crossDayPayload = buildItineraryExport({
      exportedAt: "2026-06-04T00:00:00.000Z",
      items: [
        block,
        {
          ...child,
          id: "cross-day-child",
          day: "2026-06-20",
        },
      ],
      trip: tripFixture.trip,
    });
    const missingParentPayload = buildItineraryExport({
      exportedAt: "2026-06-04T00:00:00.000Z",
      items: [
        {
          ...child,
          parentItemId: "missing-block",
        },
      ],
      trip: tripFixture.trip,
    });

    expect(() => parseItineraryImport(JSON.stringify(grandchildPayload))).toThrow(
      /unsupported itinerary import/i,
    );
    expect(() => parseItineraryImport(JSON.stringify(crossDayPayload))).toThrow(
      /unsupported itinerary import/i,
    );
    expect(() => parseItineraryImport(JSON.stringify(missingParentPayload))).toThrow(
      /unsupported itinerary import/i,
    );
  });
});
