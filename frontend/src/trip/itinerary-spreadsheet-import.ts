import { itineraryExportSchema, itineraryExportVersion } from "./itinerary-import-export-schema";
import { itemKindFromActivityType } from "./itinerary-item-kind";
import {
  detectDelimiter,
  parseDelimitedRows,
  parseDurationMinutes,
  parseSpreadsheetDate,
  parseTimeWindow,
} from "./itinerary-spreadsheet-parsing";
import { safeExternalHref } from "./safe-links";
import type {
  BookingDoc,
  ItineraryAdvisory,
  ItineraryItem,
  StopNote,
  TripTask,
} from "./types";
import type {
  ItineraryExportDocument,
  ItineraryExportItem,
  ItineraryExportRecords,
} from "./itinerary-import-export-types";

type SpreadsheetColumnKey =
  | "day"
  | "date"
  | "time"
  | "activity"
  | "mapLink"
  | "duration"
  | "transportation"
  | "note";

interface SpreadsheetHeader {
  rowIndex: number;
  columns: Partial<Record<SpreadsheetColumnKey, number>>;
}

const spreadsheetColumnAliases: Record<SpreadsheetColumnKey, string[]> = {
  day: ["day", "weekday"],
  date: ["date", "travel date"],
  time: ["time", "start time", "time range", "เวล่า", "เวลา"],
  activity: ["plans", "plan", "activity", "activities", "place", "stop"],
  mapLink: ["maps", "map", "map link", "map url", "link", "google maps"],
  duration: ["duration", "travel time", "estimate duration"],
  transportation: ["transportation", "transport", "transit", "route"],
  note: ["note", "notes", "remarks", "memo"],
};

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

function parseSpreadsheetRows(
  rows: string[][],
  header: SpreadsheetHeader,
): { items: ItineraryExportItem[]; records: ItineraryExportRecords } {
  const items: ItineraryExportItem[] = [];
  const bookingDocs: BookingDoc[] = [];
  const stopNotes: StopNote[] = [];
  const tasks: TripTask[] = [];
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

function buildSpreadsheetLinkedRecords({
  item,
  noteText,
  rowNumber,
}: {
  item: ItineraryExportItem;
  noteText: string;
  rowNumber: number;
}): Pick<ItineraryExportRecords, "bookingDocs" | "stopNotes" | "tasks"> {
  const bookingHint = hasBookingHint(noteText);
  const price = parseMoneyHint(noteText);
  const records: Pick<ItineraryExportRecords, "bookingDocs" | "stopNotes" | "tasks"> = {
    bookingDocs: [],
    stopNotes: [],
    tasks: [],
  };

  if (item.note) {
    records.stopNotes.push({
      id: `csv-note-row-${rowNumber}`,
      tripId: "",
      tripPlanId: null,
      itemId: item.id,
      authorId: "",
      body: item.note,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      version: 1,
    });
  }

  if (bookingHint || price) {
    const bookingId = `csv-booking-row-${rowNumber}`;
    records.bookingDocs.push({
      id: bookingId,
      tripId: "",
      tripPlanId: null,
      type: bookingTypeForImportedItem(item),
      title: `${item.activity} draft`,
      status: "draft",
      visibility: "shared",
      ownerMemberId: null,
      providerName: null,
      confirmationCode: null,
      startsAt: item.startTime ? `${item.day}T${item.startTime}:00` : null,
      endsAt: item.endTime ? `${item.day}T${item.endTime}:00` : null,
      timezone: null,
      priceAmount: price?.amount ?? null,
      currency: price?.currency ?? null,
      travelerIds: [],
      externalLinks: [],
      relatedItineraryItemIds: [item.id],
      relatedTaskIds: bookingHint ? [`csv-task-row-${rowNumber}`] : [],
      relatedExpenseIds: [],
      noteIds: item.note ? [`csv-note-row-${rowNumber}`] : [],
      notes: noteText || null,
      createdBy: "",
      updatedAt: new Date(0).toISOString(),
      version: 1,
    });
  }

  if (bookingHint) {
    records.tasks.push({
      id: `csv-task-row-${rowNumber}`,
      tripPlanId: null,
      title: `Confirm ${item.activity}`,
      status: "open",
      visibility: "shared",
      kind: "booking",
      createdBy: "",
      assigneeId: null,
      relatedItemId: item.id,
      version: 1,
    });
  }

  return records;
}

function findSpreadsheetHeader(rows: string[][]): SpreadsheetHeader | null {
  for (const [rowIndex, row] of rows.entries()) {
    const columns: Partial<Record<SpreadsheetColumnKey, number>> = {};
    for (const [columnIndex, cell] of row.entries()) {
      const key = spreadsheetColumnKey(cell);
      if (key && columns[key] === undefined) columns[key] = columnIndex;
    }
    const detectedColumns = Object.keys(columns).length;
    if (columns.activity !== undefined && detectedColumns >= 3) {
      return { rowIndex, columns };
    }
  }
  return null;
}

function spreadsheetColumnKey(value: string): SpreadsheetColumnKey | null {
  const normalized = normalizeHeaderLabel(value);
  for (const [key, aliases] of Object.entries(spreadsheetColumnAliases)) {
    if (aliases.includes(normalized)) return key as SpreadsheetColumnKey;
  }
  return null;
}

function normalizeHeaderLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

function readSpreadsheetCell(
  row: string[],
  columnIndex: number | undefined,
): string {
  if (columnIndex === undefined) return "";
  return row[columnIndex] ?? "";
}

function readSpreadsheetTitle(rows: string[][], headerIndex: number): string {
  for (let index = 0; index < headerIndex; index += 1) {
    const title = rows[index]?.find((cell) => cell.trim())?.trim();
    if (title) return title;
  }
  return "";
}

function classifySpreadsheetRow({
  activity,
  mapLink,
  rawActivity,
  rawTime,
  sourceNote,
  transportation,
}: {
  activity: string;
  mapLink: string;
  rawActivity: string;
  rawTime: string;
  sourceNote: string;
  transportation: string;
}): {
  activityType: ItineraryItem["activityType"];
  itemKind: ItineraryItem["itemKind"];
  isPlanBlock: boolean;
  isSubActivity: boolean;
  status: ItineraryItem["status"];
  priority: ItineraryItem["priority"];
  fallbackActivity: string;
  labels: string[];
  advisories: ItineraryAdvisory[];
} {
  const haystack = `${activity} ${transportation} ${sourceNote}`.toLowerCase();
  const hasRouteDash = /\S\s+-\s+\S/.test(activity);
  const isTravel =
    hasRouteDash ||
    /(?:->|→|\bairport\b|\bstation\b|\bsubway\b|\bmetro\b|\bbus\b|\btrain\b|\btaxi\b|\bferry\b|\bflight\b|\bmtr\b|\bdidi\b)/i.test(
      haystack,
    );
  const isFood = /(?:breakfast|lunch|dinner|restaurant|cafe|dessert|noodle|dim sum|dimsum|food|congee)/i.test(
    haystack,
  );
  const isStay = /(?:hotel|check[- ]?in|check[- ]?out|leave bag)/i.test(haystack);
  const isShopping = /(?:shopping|mall|market)/i.test(haystack);
  const isSubActivity = /^\s{2,}|^\s*(?:[-*•·]|>)\s+/.test(rawActivity);
  const isUntimedTravel = isTravel && !rawTime.trim();
  const isUntimedGroupHeading =
    Boolean(activity) &&
    !rawTime.trim() &&
    !mapLink &&
    !transportation &&
    !sourceNote;
  const labels = [
    isTravel ? "journey" : "",
    isFood ? "food" : "",
    isStay ? "stay" : "",
    isShopping ? "shopping" : "",
    isSubActivity ? "sub-activity" : "",
    isUntimedTravel ? "flexible-journey" : "",
    isUntimedGroupHeading ? "parent-block" : "",
    hasBookingHint(sourceNote) ? "booking-hint" : "",
    parseMoneyHint(sourceNote) ? "plan-estimate" : "",
  ].filter(Boolean);
  const advisories: ItineraryAdvisory[] = [];
  if (!activity && (mapLink || sourceNote || transportation)) {
    advisories.push({
      code: "csv-missing-activity",
      label: "Imported row did not include an activity name.",
      severity: "warning",
    });
  }
  const activityType: ItineraryItem["activityType"] = isTravel
    ? "travel"
    : isFood
      ? "food"
      : isStay
        ? "stay"
        : isShopping
          ? "shopping"
          : "experience";
  return {
    activityType,
    itemKind: itemKindFromActivityType(activityType),
    isPlanBlock: isUntimedTravel || isUntimedGroupHeading,
    isSubActivity,
    status: hasBookingHint(sourceNote) ? "idea" : "planned",
    priority: hasBookingHint(sourceNote) || parseMoneyHint(sourceNote) ? "high" : "normal",
    fallbackActivity: sourceNote || transportation || "Imported itinerary note",
    labels,
    advisories,
  };
}

function inferSpreadsheetPlace(activity: string): string {
  const normalized = normalizeWhitespace(activity);
  const arrowParts = normalized.split(/(?:->|→)/);
  if (arrowParts.length > 1) {
    return arrowParts[arrowParts.length - 1]?.trim() ?? normalized;
  }
  return normalized
    .replace(/^(?:breakfast|lunch|dinner|dessert)\s+at\s+/i, "")
    .replace(/^check[- ]?in\s+at\s+/i, "")
    .trim();
}

function stripSubItemPrefix(value: string): string {
  return value.replace(/^\s*(?:[-*•·]|>)\s+/, "");
}

function isSpreadsheetDayMarker(value: string): boolean {
  return /^day\s*\d+/i.test(value.trim());
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function hasBookingHint(value: string): boolean {
  return /(?:book|booking|reserve|reservation|ticket|ตั๋ว|จอง)/i.test(value);
}

function parseMoneyHint(value: string): { amount: number; currency: string } | null {
  const currencyFirst = value.match(/\b(HKD|THB|CNY|RMB|USD)\s*(\d+(?:[.,]\d+)?)\b/i);
  const amountFirst = value.match(/\b(\d+(?:[.,]\d+)?)\s*(HKD|THB|CNY|RMB|USD)\b/i);
  const match = currencyFirst ?? amountFirst;
  if (!match) return null;
  const amount = Number.parseFloat((currencyFirst ? match[2] : match[1])?.replace(",", ".") ?? "");
  const rawCurrency = (currencyFirst ? match[1] : match[2])?.toUpperCase() ?? "";
  if (!Number.isFinite(amount) || !rawCurrency) return null;
  return { amount, currency: rawCurrency === "RMB" ? "CNY" : rawCurrency };
}

function bookingTypeForImportedItem(item: Pick<ItineraryExportItem, "activityType" | "activitySubtype" | "itemKind">): BookingDoc["type"] {
  if (item.activitySubtype === "flight") return "flight";
  if (item.activityType === "travel" || item.itemKind === "travel") return "public_transport";
  if (item.activityType === "stay" || item.itemKind === "lodging") return "hotel";
  if (item.activityType === "attraction" || item.itemKind === "activity") return "activity_ticket";
  return "other";
}
