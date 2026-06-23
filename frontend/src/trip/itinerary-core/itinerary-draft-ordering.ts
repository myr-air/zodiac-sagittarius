import type { ItineraryItem } from "../types";

export function getNextSortOrder(items: ItineraryItem[], day: string): number {
  const dayOrders = items
    .filter((item) => item.day === day)
    .map((item) => item.sortOrder);
  /* v8 ignore next */
  return dayOrders.length ? Math.max(...dayOrders) + 100 : 100;
}

export function getNextChildSortOrder(
  items: ItineraryItem[],
  parentItem: ItineraryItem,
): number {
  const siblingOrders = items
    .filter(
      (item) =>
        item.day === parentItem.day && item.parentItemId === parentItem.id,
    )
    .map((item) => item.sortOrder);
  if (siblingOrders.length) return Math.max(...siblingOrders) + 10;
  return parentItem.sortOrder + 10;
}
