import {
  durationBetweenTimes as coreDurationBetweenTimes,
  endOffsetDaysBetweenTimes as coreEndOffsetDaysBetweenTimes,
  minutesToTime as coreMinutesToTime,
  parseTime,
} from "@/src/trip/itinerary-core";
export {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/src/shared/date-time-local";

export function parseTimeToMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return parseTime(trimmed);
}

export function itineraryDateTimeValue(day: string, time: string | null | undefined): string | null {
  const trimmed = time?.trim();
  return trimmed ? `${day}T${trimmed}` : null;
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
