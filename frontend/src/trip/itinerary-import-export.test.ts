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

  it("imports real organizer CSV rows with dates, maps, open times, and booking hints", () => {
    const document = parseItineraryImportDocument(`Hongkong Shenzhen trip [18 - 22 June 26],,,,,,,
,,,,,,,
Day,Date,Time,Plans,Maps,Duration,Transportation,Note
DAY1 Shenzhen,,,,,,,
Thursday,18 June 2026,,Check-in at Don Mueang,,,,
,,"8.00 - 11.30","Don Mueang International Airport (DMK) -> 
 Hong Kong International Airport (HKG)",https://maps.app.goo.gl/5LF6SFeETizxuNZQ6,,,
,,13.00 - 14.00,Airport -> Shenzhen,,,30km+ from Airport (XXX 1 hr),จองตั๋วล่วงหน้า Bus A21 - 60 HKD
,,,Gangxia - talent park,,,,
,,20.50 -,Civic center (ไฟรอบ 19.30/ 20.30/ 21.30),https://surl.amap.com/5upxC7jrz6pa,,1.5 km from restaurant (metro 15 min),
`);

    expect(document.source).toBe("csv");
    expect(document.trip).toMatchObject({
      name: "Hongkong Shenzhen trip [18 - 22 June 26]",
      startDate: "2026-06-18",
      endDate: "2026-06-18",
    });
    expect(document.items).toHaveLength(5);
    expect(document.items[0]).toMatchObject({
      id: "csv-row-5",
      day: "2026-06-18",
      activity: "Check-in at Don Mueang",
      timeMode: "flexible",
      isPlanBlock: true,
      startTime: "",
      endTime: null,
    });
    expect(document.items[1]).toMatchObject({
      activity:
        "Don Mueang International Airport (DMK) -> Hong Kong International Airport (HKG)",
      activityType: "travel",
      itemKind: "travel",
      startTime: "08:00",
      endTime: "11:30",
      durationMinutes: 210,
      mapLink: "https://maps.app.goo.gl/5LF6SFeETizxuNZQ6",
    });
    expect(document.items[2]).toMatchObject({
      activity: "Airport -> Shenzhen",
      transportation: "30km+ from Airport (XXX 1 hr)",
      note: "จองตั๋วล่วงหน้า Bus A21 - 60 HKD",
      priority: "high",
    });
    expect(document.items[3]).toMatchObject({
      activity: "Gangxia - talent park",
      activityType: "travel",
      isPlanBlock: true,
      timeMode: "flexible",
    });
    expect(document.items[4]).toMatchObject({
      startTime: "20:50",
      endTime: null,
      mapLink: "https://surl.amap.com/5upxC7jrz6pa",
      transportation: "1.5 km from restaurant (metro 15 min)",
    });
    expect(document.records?.bookingDocs[0]).toMatchObject({
      id: "csv-booking-row-7",
      type: "public_transport",
      status: "draft",
      priceAmount: 60,
      currency: "HKD",
      relatedItineraryItemIds: ["csv-row-7"],
    });
    expect(document.records?.tasks[0]).toMatchObject({
      id: "csv-task-row-7",
      kind: "booking",
      relatedItemId: "csv-row-7",
    });
    expect(document.records?.stopNotes.map((note) => note.itemId)).toEqual([
      "csv-row-7",
    ]);
  });

  it("imports pasted TSV parent blocks and indented sub-activities", () => {
    const document = parseItineraryImportDocument(
      [
        "Day\tDate\tTime\tPlans\tMaps\tDuration\tTransportation\tNote",
        "DAY2 Shenzhen\t\t\t\t\t\t\t",
        "Friday\t19 June 2026\t\tLunch ideas\t\t\t\t",
        "\t\t\t  - Bao pastry\thttps://surl.amap.com/5BhaU1X31v0fK\t\t\tเค้กไก่หยอง",
      ].join("\n"),
    );

    expect(document.items).toHaveLength(2);
    expect(document.items[0]).toMatchObject({
      id: "csv-row-3",
      isPlanBlock: true,
      parentItemId: null,
    });
    expect(document.items[1]).toMatchObject({
      id: "csv-row-4",
      activity: "Bao pastry",
      parentItemId: "csv-row-3",
      isPlanBlock: false,
      timeMode: "flexible",
      mapLink: "https://surl.amap.com/5BhaU1X31v0fK",
    });
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
