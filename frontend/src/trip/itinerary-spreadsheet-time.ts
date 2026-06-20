import type { ItineraryAdvisory, ItineraryItem } from "./types";

export interface ParsedTimeWindow {
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  endOffsetDays: number;
  timeMode: ItineraryItem["timeMode"];
  advisory?: ItineraryAdvisory;
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
