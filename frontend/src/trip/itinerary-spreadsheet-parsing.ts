import type { ItineraryAdvisory, ItineraryItem } from "./types";

export interface ParsedTimeWindow {
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  endOffsetDays: number;
  timeMode: ItineraryItem["timeMode"];
  advisory?: ItineraryAdvisory;
}

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

export function parseDelimitedRows(source: string, delimiter: "," | "\t"): string[][] {
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

export function detectDelimiter(source: string): "," | "\t" {
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

export function parseSpreadsheetDate(value: string): string | null {
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

export function parseTimeWindow(value: string): ParsedTimeWindow {
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

export function parseDurationMinutes(value: string): number | null {
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
