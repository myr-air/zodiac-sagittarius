import {
  itineraryExportSchema,
  itineraryExportVersion,
} from "./itinerary-import-export-schema";
import { normalizeImportedHierarchy } from "./itinerary-import-hierarchy";
import { parseExportItem } from "./itinerary-import-item-parser";
import { parseExportRecords } from "./itinerary-import-record-parser";
import { parseExportTrip } from "./itinerary-import-trip-parser";
import { parseSpreadsheetItineraryImportDocument } from "./itinerary-spreadsheet-import";
import {
  isRecord,
  readString,
} from "./itinerary-import-readers";
import type {
  ItineraryExportDocument,
  ItineraryExportItem,
} from "./itinerary-import-export-types";

export function parseItineraryImport(source: string): ItineraryExportItem[] {
  return parseItineraryImportDocument(source).items;
}

export function parseItineraryImportDocument(
  source: string,
): ItineraryExportDocument {
  const normalizedSource = stripByteOrderMark(source);
  if (!looksLikeJsonImport(normalizedSource)) {
    const spreadsheetDocument =
      parseSpreadsheetItineraryImportDocument(normalizedSource);
    return {
      ...spreadsheetDocument,
      items: normalizeImportedHierarchy(spreadsheetDocument.items),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalizedSource);
  } catch {
    throw new Error("Import file must be valid JSON.");
  }

  if (
    !isRecord(parsed) ||
    parsed.schema !== itineraryExportSchema ||
    parsed.version !== itineraryExportVersion ||
    !Array.isArray(parsed.items)
  ) {
    throw new Error("Unsupported itinerary import file.");
  }

  return {
    schema: itineraryExportSchema,
    version: itineraryExportVersion,
    source:
      parsed.source === "json" ||
      parsed.source === "ai" ||
      parsed.source === "csv" ||
      parsed.source === "pasted-table"
        ? parsed.source
        : undefined,
    exportedAt: readString(parsed, "exportedAt"),
    trip: parseExportTrip(parsed.trip),
    items: normalizeImportedHierarchy(parsed.items.map(parseExportItem)),
    records: parseExportRecords(parsed.records),
  };
}

function looksLikeJsonImport(source: string): boolean {
  const trimmed = source.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed === "";
}

function stripByteOrderMark(source: string): string {
  return source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
}
