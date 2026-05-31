import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem, NowNextState, ValidationWarning } from "./types";

export function getTripDates(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [startDate];

  const dates: string[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}

export function sortItemsForDay(items: ItineraryItem[], day: string): ItineraryItem[] {
  return items
    .filter((item) => item.day === day)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime));
}

export function groupItemsByDay(items: ItineraryItem[]): Array<{ day: string; items: ItineraryItem[]; warningCount: number }> {
  const days = Array.from(new Set(items.map((item) => item.day))).sort();
  return days.map((day) => {
    const dayItems = sortItemsForDay(items, day);
    return {
      day,
      items: dayItems,
      warningCount: dayItems.reduce((total, item) => total + validateItineraryItem(item, dayItems).length, 0),
    };
  });
}

export function validateItineraryItem(item: ItineraryItem, dayItems: ItineraryItem[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const start = parseTime(item.startTime);

  if (!item.startTime.trim()) {
    warnings.push({ code: "missing-start-time", message: "Add a start time before this stop can appear in Now / Next.", itemId: item.id });
  } else if (start === null) {
    warnings.push({ code: "invalid-start-time", message: "Use 24-hour time, for example 13:30.", itemId: item.id });
  }

  if (item.durationMinutes === null || item.durationMinutes <= 0) {
    warnings.push({ code: "missing-duration", message: "Add duration so route timing can be checked.", itemId: item.id });
  }

  if (!item.mapLink.trim()) {
    warnings.push({ code: "missing-map-link", message: "Add a map link or place fallback for this stop.", itemId: item.id });
  }

  if (!item.transportation.trim()) {
    warnings.push({ code: "missing-transportation", message: "Add transport notes so the group knows the next move.", itemId: item.id });
  }

  if (start !== null && item.durationMinutes && item.durationMinutes > 0) {
    const currentEnd = start + item.durationMinutes;
    const previous = dayItems
      .filter((candidate) => candidate.id !== item.id)
      .map((candidate) => ({ item: candidate, start: parseTime(candidate.startTime), duration: candidate.durationMinutes }))
      .filter((candidate): candidate is { item: ItineraryItem; start: number; duration: number } => candidate.start !== null && candidate.duration !== null && candidate.duration > 0)
      .find((candidate) => candidate.start < currentEnd && start < candidate.start + candidate.duration);

    if (previous) {
      warnings.push({
        code: "overlap",
        message: `This stop overlaps ${previous.item.activity}; ตรวจเวลาอีกครั้งก่อน publish.`,
        itemId: item.id,
      });
    }
  }

  return warnings;
}

export function getNowNext(items: ItineraryItem[], day: string, currentTime: string): NowNextState {
  const nowMinutes = parseTime(currentTime);
  if (nowMinutes === null) return { current: null, next: null, fallbackReason: "Current time is unavailable." };

  const timedItems = sortItemsForDay(items, day)
    .map((item) => ({ item, start: parseTime(item.startTime), duration: itemDuration(item) }))
    .filter((entry): entry is { item: ItineraryItem; start: number; duration: number } => entry.start !== null)
    .sort((a, b) => a.start - b.start);

  if (timedItems.length === 0) return { current: null, next: null, fallbackReason: "No timed stops for this day yet." };

  const current = timedItems.find((entry) => nowMinutes >= entry.start && nowMinutes < entry.start + entry.duration);
  const next = timedItems.find((entry) => entry.start > nowMinutes);

  return {
    current: current?.item ?? null,
    next: next?.item ?? null,
    fallbackReason: current || next ? null : "The day plan has ended.",
  };
}

function itemDuration(item: ItineraryItem): number {
  /* v8 ignore next */
  return item.durationMinutes ?? 45;
}

export function parseTime(value: string): number | null {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatDayLabel(day: string, startDate: string, locale: Locale = "en"): string {
  const start = new Date(`${startDate}T00:00:00Z`);
  const current = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(current.getTime())) return day;
  const dayNumber = Math.round((current.getTime() - start.getTime()) / 86_400_000) + 1;
  return locale === "th" ? `วันที่ ${dayNumber}` : `Day ${dayNumber}`;
}
