import {
  isRecord,
  readRecordArray,
  unsupportedImportFileError,
} from "./itinerary-import-readers";
import type { ItineraryExportRecords } from "./itinerary-import-export-types";

export function parseExportRecords(value: unknown): ItineraryExportRecords {
  if (value === undefined || value === null) {
    return { expenses: [], bookingDocs: [], stopNotes: [], tasks: [] };
  }
  if (!isRecord(value) || Array.isArray(value)) {
    throw unsupportedImportFileError();
  }
  return {
    expenses: readRecordArray(value, "expenses"),
    bookingDocs: readRecordArray(value, "bookingDocs"),
    stopNotes: readRecordArray(value, "stopNotes"),
    tasks: readRecordArray(value, "tasks"),
  };
}
