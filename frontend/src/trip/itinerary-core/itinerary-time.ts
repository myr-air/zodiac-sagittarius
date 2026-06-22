import type { ItineraryItem } from "@/src/trip/types";

export type InlineItineraryTimePatch = Partial<
  Pick<
    ItineraryItem,
    | "parentItemId"
    | "startTime"
    | "endTime"
    | "endOffsetDays"
    | "durationMinutes"
    | "activity"
    | "place"
    | "address"
    | "coordinates"
    | "mapLink"
    | "details"
    | "activityType"
    | "activitySubtype"
    | "isPlanBlock"
    | "itemKind"
    | "timeMode"
    | "status"
    | "priority"
    | "transportation"
  >
>;

export function parseTime(value: string): number | null {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function endOffsetDaysBetweenTimes(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  if (start === null || end === null) return 0;
  return end <= start ? 1 : 0;
}

export function durationBetweenTimes(
  startTime: string,
  endTime: string,
  endOffsetDays = endOffsetDaysBetweenTimes(startTime, endTime),
): number | null {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  if (start === null || end === null) return null;
  const duration = end + endOffsetDays * 24 * 60 - start;
  return Math.max(1, duration);
}

export function normalizeDurationMinutes(value: unknown): number {
  return Math.max(1, Math.round(Number(value) || 1));
}

export function minutesToTime(value: number): string {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function daysBetweenIsoDates(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
}

export function shiftIsoDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function itineraryDateTime(day: string, time: string): string {
  return `${day}T${time}:00`;
}

export function shiftItineraryItemsToStartDate(
  items: ItineraryItem[],
  currentStartDate: string,
  nextStartDate: string,
): ItineraryItem[] {
  const dayShift = daysBetweenIsoDates(currentStartDate, nextStartDate);
  if (!dayShift) return items;
  return items.map((item) => ({
    ...item,
    day: shiftIsoDate(item.day, dayShift),
  }));
}

export function normalizeInlineTimePatch(
  item: ItineraryItem,
  patch: InlineItineraryTimePatch,
): InlineItineraryTimePatch {
  const nextPatch: InlineItineraryTimePatch = { ...patch };
  const hasStartTime = nextPatch.startTime !== undefined;
  const hasEndTime = nextPatch.endTime !== undefined;
  const hasEndOffsetDays = nextPatch.endOffsetDays !== undefined;
  if (!hasStartTime && !hasEndTime && !hasEndOffsetDays) return nextPatch;

  const startTime = hasStartTime ? nextPatch.startTime : item.startTime;
  const endTime = hasEndTime ? nextPatch.endTime : item.endTime;
  if (!endTime) {
    if (hasEndTime) {
      nextPatch.endOffsetDays = 0;
      nextPatch.durationMinutes = null;
    }
    return nextPatch;
  }

  const start = parseTime(startTime ?? "");
  const end = parseTime(endTime);
  if (start === null || end === null) return nextPatch;

  const minimumEndOffsetDays = end <= start ? 1 : 0;
  const endOffsetDays = hasEndOffsetDays
    ? Math.max(nextPatch.endOffsetDays ?? 0, minimumEndOffsetDays)
    : minimumEndOffsetDays;
  if (endOffsetDays !== (nextPatch.endOffsetDays ?? item.endOffsetDays ?? 0)) {
    nextPatch.endOffsetDays = endOffsetDays;
  }
  const durationMinutes = end + endOffsetDays * 24 * 60 - start;
  if (durationMinutes > 0) {
    nextPatch.durationMinutes = durationMinutes;
  }
  return nextPatch;
}

export function buildInlineItineraryItemPatch(
  item: ItineraryItem,
  patch: InlineItineraryTimePatch,
): InlineItineraryTimePatch | null {
  const nextPatch = normalizeInlineTimePatch(item, patch);
  if (nextPatch.activity !== undefined)
    nextPatch.activity = nextPatch.activity.trim();
  if (nextPatch.place !== undefined)
    nextPatch.place = nextPatch.place.trim();
  if (nextPatch.transportation !== undefined)
    nextPatch.transportation = nextPatch.transportation.trim();
  if (
    nextPatch.durationMinutes !== undefined &&
    nextPatch.durationMinutes !== null
  )
    nextPatch.durationMinutes = normalizeDurationMinutes(nextPatch.durationMinutes);
  if (nextPatch.activity !== undefined && nextPatch.activity.length === 0)
    return null;
  if (nextPatch.place !== undefined && nextPatch.place.length === 0)
    return null;
  const changedPatch = Object.fromEntries(
    Object.entries(nextPatch).filter(
      ([key, value]) => item[key as keyof InlineItineraryTimePatch] !== value,
    ),
  ) as InlineItineraryTimePatch;
  return Object.keys(changedPatch).length > 0 ? changedPatch : null;
}
