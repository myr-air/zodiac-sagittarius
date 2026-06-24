import type { ItineraryDayGroup } from "@/src/trip/itinerary-core";
import type { ItineraryItem } from "@/src/trip/types";

export function mergeTripDayGroups(
  groups: ItineraryDayGroup[],
  startDate: string,
  endDate: string,
  tripDates: string[],
): ItineraryDayGroup[] {
  const groupsByDay = new Map(groups.map((group) => [group.day, group]));
  const days = new Set<string>(tripDates);
  for (const group of groups) {
    if (group.items.length) days.add(group.day);
  }

  return Array.from(days)
    .sort()
    .map((day) => groupsByDay.get(day) ?? { day, items: [], warningCount: 0 });
}

export function groupTopLevelItems(items: ItineraryItem[]): ItineraryItem[] {
  const itemIds = new Set(items.map((item) => item.id));
  return items.filter(
    (item) => !item.parentItemId || !itemIds.has(item.parentItemId),
  );
}

export function groupChildItemsByParent(
  items: ItineraryItem[],
): Map<string, ItineraryItem[]> {
  const childrenByParent = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    if (!item.parentItemId) continue;
    childrenByParent.set(item.parentItemId, [
      ...(childrenByParent.get(item.parentItemId) ?? []),
      item,
    ]);
  }
  for (const [parentId, children] of childrenByParent) {
    childrenByParent.set(parentId, [...children].sort(compareItineraryItems));
  }
  return childrenByParent;
}

export function compareItineraryItems(a: ItineraryItem, b: ItineraryItem): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
  return a.activity.localeCompare(b.activity);
}
