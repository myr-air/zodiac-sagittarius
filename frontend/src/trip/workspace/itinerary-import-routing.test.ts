import { describe, expect, it } from "vitest";
import {
  emptyItineraryExportRecords,
  pendingItineraryImportFromDocument,
  resolveCreatedImportId,
  shouldUseApiItineraryImport,
} from "./itinerary-import-model";

describe("itinerary import routing model", () => {
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

  it("resolves ids from created import id maps without changing nullish ids", () => {
    const firstMap = new Map([["source-task", "created-task"]]);
    const secondMap = new Map([["source-note", "created-note"]]);

    expect(resolveCreatedImportId(null, [firstMap, secondMap])).toBeNull();
    expect(resolveCreatedImportId(undefined, [firstMap, secondMap])).toBeUndefined();
    expect(resolveCreatedImportId("source-task", [firstMap, secondMap])).toBe("created-task");
    expect(resolveCreatedImportId("source-note", [firstMap, secondMap])).toBe("created-note");
    expect(resolveCreatedImportId("unmapped", [firstMap, secondMap])).toBe("unmapped");
  });
});
