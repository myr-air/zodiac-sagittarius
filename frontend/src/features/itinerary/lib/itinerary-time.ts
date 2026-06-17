export function parseTimeToMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
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
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return 0;
  return end <= start ? 1 : 0;
}

export function minutesToTime(value: number): string {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
