import { describe, expect, it } from "vitest";
import { parseItineraryImportDocument } from "../../../itinerary-import-export";

describe("itinerary import/export spreadsheet rows", () => {
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
});
