import {
  durationBetweenTimes as coreDurationBetweenTimes,
  endOffsetDaysBetweenTimes as coreEndOffsetDaysBetweenTimes,
  minutesToTime as coreMinutesToTime,
  parseTime,
} from "@/src/trip/itinerary-core";

export function parseTimeToMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return parseTime(trimmed);
}

export function itineraryDateTimeValue(day: string, time: string | null | undefined): string | null {
  const trimmed = time?.trim();
  return trimmed ? `${day}T${trimmed}` : null;
}

export function toDateTimeLocalValue(value: string | null | undefined): string {
  return value ? value.slice(0, 16) : "";
}

export function fromDateTimeLocalValue(value: string): string | null {
  return value.trim() || null;
}

export function endOffsetDaysBetweenTimes(startTime: string, endTime: string): number {
  return coreEndOffsetDaysBetweenTimes(startTime.trim(), endTime.trim());
}

export function durationBetweenTimes(
  startTime: string,
  endTime: string,
  endOffsetDays = endOffsetDaysBetweenTimes(startTime, endTime),
): number | null {
  return coreDurationBetweenTimes(startTime.trim(), endTime.trim(), endOffsetDays);
}

export function minutesToTime(value: number): string {
  return coreMinutesToTime(value);
}
