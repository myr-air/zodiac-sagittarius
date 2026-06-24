import { buildSpreadsheetLinkedRecords } from "./itinerary-spreadsheet-records";
import {
  readSpreadsheetCell,
  type SpreadsheetHeader,
} from "./itinerary-spreadsheet-columns";
import { parseSpreadsheetDate } from "./itinerary-spreadsheet-dates";
import {
  parseDurationMinutes,
  parseTimeWindow,
} from "./itinerary-spreadsheet-time";
import {
  classifySpreadsheetRow,
  inferSpreadsheetPlace,
  isSpreadsheetDayMarker,
  normalizeWhitespace,
  stripSubItemPrefix,
} from "./itinerary-spreadsheet-row";
import { safeExternalHref } from "../places";
import type { ItineraryAdvisory } from "../types";
import type {
  ItineraryExportItem,
  ItineraryExportRecords,
} from "./itinerary-import-export-types";

export interface ParsedSpreadsheetRows {
  items: ItineraryExportItem[];
  records: ItineraryExportRecords;
}

export function parseSpreadsheetRows(
  rows: string[][],
  header: SpreadsheetHeader,
): ParsedSpreadsheetRows {
  const items: ItineraryExportItem[] = [];
  const bookingDocs: ItineraryExportRecords["bookingDocs"] = [];
  const stopNotes: ItineraryExportRecords["stopNotes"] = [];
  const tasks: ItineraryExportRecords["tasks"] = [];
  let currentDay = "";
  let currentDayLabel = "";
  let lastPlanBlockId: string | null = null;
  let sortOrder = 100;

  for (const [rowIndex, row] of rows.entries()) {
    if (rowIndex <= header.rowIndex) continue;
    const rowNumber = rowIndex + 1;
    const rawActivity = readSpreadsheetCell(row, header.columns.activity);
    const activity = normalizeWhitespace(stripSubItemPrefix(rawActivity)).trim();
    const rawDate = normalizeWhitespace(readSpreadsheetCell(row, header.columns.date));
    const parsedDate = parseSpreadsheetDate(rawDate);
    const rawDay = normalizeWhitespace(readSpreadsheetCell(row, header.columns.day));
    const rawTime = normalizeWhitespace(readSpreadsheetCell(row, header.columns.time));
    const mapLink = safeExternalHref(readSpreadsheetCell(row, header.columns.mapLink).trim());
    const rawDuration = normalizeWhitespace(readSpreadsheetCell(row, header.columns.duration));
    const transportation = normalizeWhitespace(
      readSpreadsheetCell(row, header.columns.transportation),
    );
    const sourceNote = normalizeWhitespace(readSpreadsheetCell(row, header.columns.note));

    if (parsedDate) currentDay = parsedDate;
    if (isSpreadsheetDayMarker(rawDay) && !activity) {
      currentDayLabel = rawDay;
      lastPlanBlockId = null;
      continue;
    }
    if (!activity && !mapLink && !rawDuration && !transportation && !sourceNote) {
      continue;
    }
    if (!currentDay) {
      throw new Error(`CSV row ${rowNumber} needs a date before itinerary details.`);
    }

    const noteParts = [
      sourceNote,
      rawDuration && parseDurationMinutes(rawDuration) === null
        ? `Duration: ${rawDuration}`
        : "",
    ].filter(Boolean);
    const timeWindow = parseTimeWindow(rawTime);
    const durationMinutes =
      parseDurationMinutes(rawDuration) ?? timeWindow.durationMinutes;
    const classification = classifySpreadsheetRow({
      activity,
      mapLink,
      rawActivity,
      rawTime,
      sourceNote,
      transportation,
    });
    const id = `csv-row-${rowNumber}`;
    const item: ItineraryExportItem = {
      id,
      itemKind: classification.itemKind,
      timeMode: timeWindow.timeMode,
      parentItemId:
        classification.isSubActivity && lastPlanBlockId ? lastPlanBlockId : null,
      isPlanBlock: classification.isPlanBlock,
      status: classification.status,
      priority: classification.priority,
      day: currentDay,
      sortOrder,
      startTime: timeWindow.startTime,
      endTime: timeWindow.endTime,
      endOffsetDays: timeWindow.endOffsetDays,
      activity: activity || classification.fallbackActivity,
      activityType: classification.activityType,
      activitySubtype: null,
      place: inferSpreadsheetPlace(activity || classification.fallbackActivity),
      linkLabel: mapLink ? "Map" : "",
      mapLink,
      durationMinutes,
      transportation,
      details: {
        importSource: "csv",
        importRowNumber: rowNumber,
        importDayLabel: currentDayLabel || undefined,
        importRawTime: rawTime || undefined,
        importRawDuration: rawDuration || undefined,
        importClassification: classification.labels,
      },
      advisories: [
        timeWindow.advisory,
        ...classification.advisories,
      ].filter((advisory): advisory is ItineraryAdvisory => Boolean(advisory)),
      note: noteParts.join("\n"),
    };
    items.push(item);

    if (item.isPlanBlock) lastPlanBlockId = item.id;
    if (!item.parentItemId && !item.isPlanBlock) lastPlanBlockId = null;
    sortOrder += 100;

    const linkedRecords = buildSpreadsheetLinkedRecords({
      item,
      noteText: [sourceNote, transportation, rawDuration].filter(Boolean).join(" "),
      rowNumber,
    });
    bookingDocs.push(...linkedRecords.bookingDocs);
    stopNotes.push(...linkedRecords.stopNotes);
    tasks.push(...linkedRecords.tasks);
  }

  return {
    items,
    records: { expenses: [], bookingDocs, stopNotes, tasks },
  };
}
