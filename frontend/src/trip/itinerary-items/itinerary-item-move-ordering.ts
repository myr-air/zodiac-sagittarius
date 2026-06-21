import { compareItineraryItemsWithinDay } from "./itinerary-item-ordering";
import type { ItineraryItem } from "../types";

export function sortedTargetDayItemsExcluding(
  items: ItineraryItem[],
  planVariantId: string,
  day: string,
  excludedItemId: string,
): ItineraryItem[] {
  return items
    .filter(
      (item) =>
        item.planVariantId === planVariantId &&
        item.day === day &&
        item.id !== excludedItemId,
    )
    .sort(compareItineraryItemsWithinDay);
}

export function renumberItineraryDayItems(
  items: ItineraryItem[],
): ItineraryItem[] {
  return items.map((item, index) => ({
    ...item,
    sortOrder: (index + 1) * 100,
  }));
}

export function mergeItineraryDayItems(
  items: ItineraryItem[],
  dayItems: ItineraryItem[],
): ItineraryItem[] {
  const nextItemsById = new Map(dayItems.map((item) => [item.id, item]));
  return items.map((item) => nextItemsById.get(item.id) ?? item);
}
