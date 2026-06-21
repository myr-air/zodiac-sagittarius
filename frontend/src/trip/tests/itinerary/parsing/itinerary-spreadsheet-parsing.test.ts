import { describe, expect, it } from "vitest";
import {
  detectDelimiter,
  parseDelimitedRows,
  parseDurationMinutes,
  parseSpreadsheetDate,
  parseTimeWindow,
} from "../../../itinerary-import-export/itinerary-spreadsheet-parsing";

describe("itinerary spreadsheet parsing", () => {
  it("detects tab-delimited spreadsheets and parses quoted CSV cells", () => {
    expect(detectDelimiter("Day\tDate\tPlans\n1\t2026-06-19\tArrive")).toBe("\t");

    expect(
      parseDelimitedRows('Day,Plans\n1,"Lunch, ferry ""fast"" lane"', ","),
    ).toEqual([
      ["Day", "Plans"],
      ["1", 'Lunch, ferry "fast" lane'],
    ]);
  });

  it("normalizes supported spreadsheet date formats", () => {
    expect(parseSpreadsheetDate("2026-06-19")).toBe("2026-06-19");
    expect(parseSpreadsheetDate("19 Jun 26")).toBe("2026-06-19");
    expect(parseSpreadsheetDate("06/19/2026")).toBe("2026-06-19");
    expect(parseSpreadsheetDate("19/06/2026")).toBe("2026-06-19");
    expect(parseSpreadsheetDate("not a date")).toBeNull();
  });

  it("parses scheduled, overnight, and ambiguous time windows", () => {
    expect(parseTimeWindow("9:30am - 11")).toMatchObject({
      startTime: "09:30",
      endTime: "11:00",
      durationMinutes: 90,
      endOffsetDays: 0,
      timeMode: "scheduled",
    });

    expect(parseTimeWindow("23:30 - 01:15")).toMatchObject({
      startTime: "23:30",
      endTime: "01:15",
      durationMinutes: 105,
      endOffsetDays: 1,
      timeMode: "scheduled",
    });

    expect(parseTimeWindow("after lunch")).toMatchObject({
      startTime: "",
      endTime: null,
      durationMinutes: null,
      endOffsetDays: 0,
      timeMode: "flexible",
      advisory: {
        code: "csv-ambiguous-time",
        severity: "warning",
      },
    });
  });

  it("parses spreadsheet duration hints", () => {
    expect(parseDurationMinutes("75")).toBe(75);
    expect(parseDurationMinutes("1.5 hours")).toBe(90);
    expect(parseDurationMinutes("1 hr 20 min")).toBe(80);
    expect(parseDurationMinutes("unknown")).toBeNull();
  });
});
