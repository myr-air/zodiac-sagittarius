import { itineraryExportSchema, itineraryExportVersion } from "./itinerary-import-export-schema";
import {
  findSpreadsheetHeader,
  readSpreadsheetTitle,
} from "./itinerary-spreadsheet-columns";
import {
  detectDelimiter,
  parseDelimitedRows,
} from "./itinerary-spreadsheet-parsing";
import { parseSpreadsheetRows } from "./itinerary-spreadsheet-row-parser";
import type {
  ItineraryExportDocument,
} from "./itinerary-import-export-types";

export function parseSpreadsheetItineraryImportDocument(source: string): ItineraryExportDocument {
  const rows = parseDelimitedRows(source, detectDelimiter(source));
  const header = findSpreadsheetHeader(rows);
  if (!header) {
    throw new Error(
      "Import file must be valid JSON or a CSV/TSV table with a Plans or Activity column.",
    );
  }

  const parsed = parseSpreadsheetRows(rows, header);
  if (parsed.items.length === 0) {
    throw new Error("CSV import did not contain any itinerary rows.");
  }

  const firstDay = parsed.items[0]?.day ?? "";
  const lastDay = parsed.items[parsed.items.length - 1]?.day ?? firstDay;
  return {
    schema: itineraryExportSchema,
    version: itineraryExportVersion,
    source: "csv",
    exportedAt: new Date(0).toISOString(),
    trip: {
      id: "",
      name: readSpreadsheetTitle(rows, header.rowIndex),
      destinationLabel: "",
      startDate: firstDay,
      endDate: lastDay,
      activePlanVariantId: "",
      mainTripPlanId: "",
      planVariants: [],
      tripPlans: [],
      partySize: undefined,
      defaultTimezone: undefined,
    },
    items: parsed.items,
    records: parsed.records,
  };
}
