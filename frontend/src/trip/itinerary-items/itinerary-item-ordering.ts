import type { ItineraryItem } from "../types";

export function sortItineraryItemsByDayAndHierarchy(
  items: ItineraryItem[],
): ItineraryItem[] {
  const byDay = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    byDay.set(item.day, [...(byDay.get(item.day) ?? []), item]);
  }

  return Array.from(byDay.keys())
    .sort()
    .flatMap((day) =>
      orderHierarchyItemsForDay(
        (byDay.get(day) ?? [])
          .slice()
          .sort(compareItineraryItemsWithinDay),
      ),
    );
}

export function orderHierarchyItemsForDay(
  sortedDayItems: ItineraryItem[],
): ItineraryItem[] {
  const ids = new Set(sortedDayItems.map((item) => item.id));
  const childrenByParentId = new Map<string, ItineraryItem[]>();
  for (const item of sortedDayItems) {
    if (!item.parentItemId || !ids.has(item.parentItemId)) continue;
    childrenByParentId.set(
      item.parentItemId,
      [...(childrenByParentId.get(item.parentItemId) ?? []), item],
    );
  }

  const ordered: ItineraryItem[] = [];
  const emitted = new Set<string>();
  for (const item of sortedDayItems) {
    if (item.parentItemId && ids.has(item.parentItemId)) continue;
    ordered.push(item);
    emitted.add(item.id);
    for (const child of childrenByParentId.get(item.id) ?? []) {
      ordered.push(child);
      emitted.add(child.id);
    }
  }

  for (const item of sortedDayItems) {
    if (!emitted.has(item.id)) ordered.push(item);
  }

  return ordered;
}

export function compareItineraryItemsWithinDay(
  a: ItineraryItem,
  b: ItineraryItem,
): number {
  const aFlexible = a.timeMode === "flexible";
  const bFlexible = b.timeMode === "flexible";
  if (aFlexible !== bFlexible) return aFlexible ? 1 : -1;

  if (!aFlexible) {
    const aTime = parseHHMM(a.startTime);
    const bTime = parseHHMM(b.startTime);
    if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime;
    if (aTime !== null && bTime === null) return -1;
    if (aTime === null && bTime !== null) return 1;
  }

  return a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id);
}

function parseHHMM(value: string): number | null {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
