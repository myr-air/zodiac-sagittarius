import type { ItineraryItem } from "@/src/trip/types";

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
