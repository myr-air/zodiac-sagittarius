import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem, ValidationWarning } from "./types";
import {
  compareItineraryItemsWithinDay,
  orderHierarchyItemsForDay,
  sortItineraryItemsByDayAndHierarchy,
} from "./itinerary-item-ordering";
import {
  buildOverlapWarnings,
  getTimeWindowInterval,
  validateHierarchyFields,
  validateItemFields,
} from "./itinerary-validation";
import { parseTime } from "./itinerary-time";

export interface ItineraryDayGroup {
  day: string;
  items: ItineraryItem[];
  warningCount: number;
}

export interface ItineraryRouteDayStat {
  day: string;
  itemCount: number;
  coordinateItemCount: number;
  warningCount: number;
}

export interface ItineraryView {
  dayGroups: ItineraryDayGroup[];
  sortedItems: ItineraryItem[];
  warningCount: number;
  routeDayStats: ItineraryRouteDayStat[];
}

export function sortItemsForDay(items: ItineraryItem[], day: string): ItineraryItem[] {
  return orderHierarchyItemsForDay(items
    .filter((item) => item.day === day)
    .slice()
    .sort(compareItineraryItemsWithinDay));
}

export function buildItineraryView(items: ItineraryItem[]): ItineraryView {
  const sortedItems = sortItineraryItemsByDayAndHierarchy(items);

  const dayBuckets = new Map<string, ItineraryItem[]>();
  for (const item of sortedItems) {
    const bucket = dayBuckets.get(item.day);
    if (!bucket) {
      dayBuckets.set(item.day, [item]);
    } else {
      bucket.push(item);
    }
  }

  const dayGroups: ItineraryDayGroup[] = [];
  const routeDayStats: ItineraryRouteDayStat[] = [];

  let warningCount = 0;

  for (const day of Array.from(dayBuckets.keys()).sort()) {
    const dayItems = dayBuckets.get(day) ?? [];
    const baseWarningsByItem = new Map<string, ValidationWarning[]>();

    for (const item of dayItems) {
      baseWarningsByItem.set(item.id, [
        ...validateItemFields(item),
        ...validateHierarchyFields(item, dayItems),
      ]);
    }

    const overlapWarningsByItem = buildOverlapWarnings(dayItems);
    for (const [itemId, overlapWarnings] of overlapWarningsByItem) {
      baseWarningsByItem.set(itemId, [...(baseWarningsByItem.get(itemId) ?? []), ...overlapWarnings]);
    }

    const dayWarningCount = dayItems.reduce(
      (total, item) => total + (baseWarningsByItem.get(item.id)?.length ?? 0),
      0,
    );

    warningCount += dayWarningCount;
    dayGroups.push({ day, items: dayItems, warningCount: dayWarningCount });
    routeDayStats.push({
      day,
      itemCount: dayItems.length,
      coordinateItemCount: dayItems.filter((item) => item.coordinates).length,
      warningCount: dayWarningCount,
    });
  }

  return { dayGroups, sortedItems, warningCount, routeDayStats };
}

export function groupItemsByDay(items: ItineraryItem[]): ItineraryDayGroup[] {
  return buildItineraryView(items).dayGroups;
}

export function validateItineraryItem(item: ItineraryItem, dayItems: ItineraryItem[]): ValidationWarning[] {
  const warnings = [
    ...validateItemFields(item),
    ...validateHierarchyFields(item, dayItems),
  ];
  const overlapWarnings = buildOverlapWarnings(dayItems);
  const itemOverlapWarnings = overlapWarnings.get(item.id);
  if (itemOverlapWarnings) warnings.push(...itemOverlapWarnings);
  return warnings;
}

export function getNowNext(
  items: ItineraryItem[],
  day: string,
  currentTime: string,
): { current: ItineraryItem | null; next: ItineraryItem | null; fallbackReason: string | null } {
  const nowMinutes = parseTime(currentTime);
  if (nowMinutes === null) return { current: null, next: null, fallbackReason: "Current time is unavailable." };

  const timedItems = sortItemsForDay(items, day)
    .map((item) => getTimeWindowInterval(item))
    .filter((entry): entry is { item: ItineraryItem; start: number; end: number } => entry !== null)
    .sort((a, b) => a.start - b.start);

  if (timedItems.length === 0) return { current: null, next: null, fallbackReason: "No timed stops for this day yet." };

  const current = timedItems.find((entry) => nowMinutes >= entry.start && nowMinutes < entry.end);
  const next = timedItems.find((entry) => entry.start > nowMinutes);

  return {
    current: current?.item ?? null,
    next: next?.item ?? null,
    fallbackReason: current || next ? null : "The day plan has ended.",
  };
}

export function formatDayLabel(day: string, startDate: string, locale: Locale = "en"): string {
  const start = new Date(`${startDate}T00:00:00Z`);
  const current = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(current.getTime())) return day;
  const dayNumber = Math.round((current.getTime() - start.getTime()) / 86_400_000) + 1;
  return locale === "th" ? `วันที่ ${dayNumber}` : `Day ${dayNumber}`;
}
