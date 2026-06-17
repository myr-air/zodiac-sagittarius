import {
  endOffsetDaysBetweenTimes,
  minutesToTime,
  parseTimeToMinutes,
} from "@/src/features/itinerary/lib/itinerary-time";

export function addMinutesToTime(stopStartTime: string, durationMinutes: number): string {
  const start = parseTimeToMinutes(stopStartTime);
  if (start === null) return "";
  const total = (start + durationMinutes) % (24 * 60);
  return minutesToTime(total);
}

export function endWindowFromDuration(stopStartTime: string, durationMinutes: number): { endOffsetDays: number; endTime: string } | null {
  const start = parseTimeToMinutes(stopStartTime);
  if (start === null) return null;
  const total = start + Math.max(1, durationMinutes);
  return {
    endTime: minutesToTime(total % (24 * 60)),
    endOffsetDays: Math.floor(total / (24 * 60)),
  };
}

export function durationBetweenTimes(
  startTime: string,
  endTime: string,
  endOffsetDays = endOffsetDaysBetweenTimes(startTime, endTime),
): number | null {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return null;
  const duration = end + endOffsetDays * 24 * 60 - start;
  return Math.max(1, duration);
}

export function parseRouteActivity(value: string): { destination: string; durationMinutes?: number; origin: string; startTime?: string } | null {
  const match = /^\s*(.+?)\s*(?:->|→)\s*(.+?)(?:\s*\((.*?)\))?\s*$/.exec(value);
  if (!match) return null;
  const origin = match[1]?.trim();
  const destination = match[2]?.trim();
  if (!origin || !destination) return null;
  const timeRange = parseTimeRange(match[3] ?? "");

  return {
    destination,
    durationMinutes: timeRange?.durationMinutes,
    origin,
    startTime: timeRange?.startTime,
  };
}

export function parseTimeRange(value: string): { durationMinutes: number; startTime: string } | null {
  const match = /(\d{1,2})[.:](\d{2})\s*(am|pm)?\s*[-–]\s*(\d{1,2})[.:](\d{2})\s*(am|pm)?/i.exec(value);
  if (!match) return null;
  const startTime = normalizeClockTime(match[1], match[2], match[3] || match[6]);
  const endTime = normalizeClockTime(match[4], match[5], match[6] || match[3]);
  if (!startTime || !endTime) return null;
  const durationMinutes = durationBetweenTimes(startTime, endTime);
  if (durationMinutes === null) return null;
  return { durationMinutes, startTime };
}

function normalizeClockTime(hourText: string, minuteText: string, meridiem?: string): string | null {
  let hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute > 59) return null;
  if (meridiem) {
    const normalizedMeridiem = meridiem.toLowerCase();
    if (hour < 1 || hour > 12) return null;
    if (normalizedMeridiem === "pm" && hour < 12) hour += 12;
    if (normalizedMeridiem === "am" && hour === 12) hour = 0;
  }
  if (hour > 23) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export { endOffsetDaysBetweenTimes, parseTimeToMinutes as timeToMinutes };
