import { itineraryExportSchema, itineraryExportVersion } from "./itinerary-import-export-schema";
import { itemKindFromActivityType } from "./itinerary-item-kind";
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
} from "./itinerary-import-export";

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

interface ParsedTimeWindow {
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  endOffsetDays: number;
  timeMode: ItineraryItem["timeMode"];
  advisory?: ItineraryAdvisory;
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

const monthNumbers: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
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

function parseDelimitedRows(source: string, delimiter: "," | "\t"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const text = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"' && cell.trim() === "") {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (inQuotes) throw new Error("CSV import has an unterminated quoted cell.");
  row.push(cell);
  rows.push(row);
  return rows;
}

function detectDelimiter(source: string): "," | "\t" {
  const lines = source.split(/\r?\n/).slice(0, 12);
  const tabCount = lines.reduce(
    (total, line) => total + (line.match(/\t/g)?.length ?? 0),
    0,
  );
  const commaCount = lines.reduce(
    (total, line) => total + (line.match(/,/g)?.length ?? 0),
    0,
  );
  return tabCount > commaCount ? "\t" : ",";
}

function parseSpreadsheetDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const namedMonth = trimmed.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2,4})$/,
  );
  if (namedMonth) {
    const day = Number.parseInt(namedMonth[1] ?? "", 10);
    const month = monthNumbers[(namedMonth[2] ?? "").toLowerCase()];
    const year = normalizeYear(Number.parseInt(namedMonth[3] ?? "", 10));
    if (isValidDateParts(year, month, day)) return formatIsoDate(year, month, day);
  }
  const numericDate = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (numericDate) {
    const first = Number.parseInt(numericDate[1] ?? "", 10);
    const second = Number.parseInt(numericDate[2] ?? "", 10);
    const year = normalizeYear(Number.parseInt(numericDate[3] ?? "", 10));
    const day = first > 12 ? first : second;
    const month = first > 12 ? second : first;
    if (isValidDateParts(year, month, day)) return formatIsoDate(year, month, day);
  }
  return null;
}

function normalizeYear(year: number): number {
  if (year < 100) return year >= 70 ? 1900 + year : 2000 + year;
  return year;
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    year >= 1900 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  );
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function parseTimeWindow(value: string): ParsedTimeWindow {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      startTime: "",
      endTime: null,
      durationMinutes: null,
      endOffsetDays: 0,
      timeMode: "flexible",
    };
  }
  const parts = trimmed.split(/\s*(?:-|–|—|to)\s*/i);
  const start = parseSpreadsheetTime(parts[0] ?? "");
  const end = parseSpreadsheetTime(parts[1] ?? "");
  if (!start) {
    return {
      startTime: "",
      endTime: null,
      durationMinutes: null,
      endOffsetDays: 0,
      timeMode: "flexible",
      advisory: {
        code: "csv-ambiguous-time",
        label: `Could not read time "${trimmed}"`,
        severity: "warning",
      },
    };
  }
  if (!end) {
    return {
      startTime: start.label,
      endTime: null,
      durationMinutes: null,
      endOffsetDays: 0,
      timeMode: "scheduled",
    };
  }
  const endOffsetDays = end.minutes < start.minutes ? 1 : 0;
  const durationMinutes = end.minutes + endOffsetDays * 24 * 60 - start.minutes;
  return {
    startTime: start.label,
    endTime: end.label,
    durationMinutes,
    endOffsetDays,
    timeMode: "scheduled",
  };
}

function parseSpreadsheetTime(value: string): { label: string; minutes: number } | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2})(?:[:.](\d{1,2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hour = Number.parseInt(match[1] ?? "", 10);
  const minute = Number.parseInt(match[2] ?? "0", 10);
  const meridiem = match[3];
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return {
    label: `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`,
    minutes: hour * 60 + minute,
  };
}

function parseDurationMinutes(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10);
  let total = 0;
  const hour = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/);
  const minute = trimmed.match(/(\d+)\s*(?:m|min|mins|minute|minutes)/);
  if (hour) total += Math.round(Number.parseFloat(hour[1] ?? "0") * 60);
  if (minute) total += Number.parseInt(minute[1] ?? "0", 10);
  return total > 0 ? total : null;
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
