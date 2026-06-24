import { mapById } from "@/src/shared/collection";
import type { ItineraryItem } from "../types";

export function hasDescendantItem(
  items: ItineraryItem[],
  parentItemId: string,
  candidateItemId: string,
): boolean {
  const itemsById = mapById(items);
  const visitedItemIds = new Set<string>();
  let currentItem = itemsById.get(candidateItemId) ?? null;
  while (currentItem?.parentItemId) {
    if (currentItem.parentItemId === parentItemId) return true;
    if (visitedItemIds.has(currentItem.id)) return false;
    visitedItemIds.add(currentItem.id);
    currentItem = itemsById.get(currentItem.parentItemId) ?? null;
  }
  return false;
}
