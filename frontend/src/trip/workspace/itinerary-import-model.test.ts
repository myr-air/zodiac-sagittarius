import { describe, expect, it } from "vitest";
import {
  emptyItineraryExportRecords,
  pendingItineraryImportFromDocument,
  shouldUseApiItineraryImport,
} from "./itinerary-import-model";

describe("itinerary import model", () => {
  it("keeps spreadsheet-like imports local and sends structured JSON through the API", () => {
    expect(
      shouldUseApiItineraryImport({
        contentType: "application/json",
        fileName: "trip-itinerary.json",
      }),
    ).toBe(true);
    expect(
      shouldUseApiItineraryImport({
        contentType: "text/csv",
        fileName: "trip-itinerary.csv",
      }),
    ).toBe(false);
    expect(
      shouldUseApiItineraryImport({
        contentType: "text/plain",
        fileName: "paste.tsv",
      }),
    ).toBe(false);
  });

  it("normalizes pending imports with empty linked records by default", () => {
    expect(
      pendingItineraryImportFromDocument({
        fileName: "trip-itinerary.json",
        document: {
          items: [],
        },
      }),
    ).toEqual({
      fileName: "trip-itinerary.json",
      items: [],
      records: emptyItineraryExportRecords(),
    });
  });
});
