import {
  mergeItineraryDayItems,
  renumberItineraryDayItems,
  sortedTargetDayItemsExcluding,
} from "./itinerary-item-move-ordering";
import { findItineraryItemById } from "./itinerary-item-lookup";
import { mapById } from "@/src/shared/collection";
import type {
  ItineraryItem,
  Trip,
} from "../types";

export function moveTripItem(
  current: Trip,
  draggedItemId: string,
  targetItemId: string,
  planVariantId: string,
  updatedAt: string,
): Trip | null {
  const draggedItem = findItineraryItemById(current.itineraryItems, draggedItemId);
  const targetItem = findItineraryItemById(current.itineraryItems, targetItemId);

  if (
    !draggedItem ||
    !targetItem ||
    draggedItem.planVariantId !== planVariantId ||
    targetItem.planVariantId !== planVariantId
  )
    return null;
  const nextParentItemId = targetItem.parentItemId ?? null;
  if (
    nextParentItemId === draggedItem.id ||
    (draggedItem.isPlanBlock && nextParentItemId) ||
    hasDescendantItem(current.itineraryItems, draggedItem.id, targetItem.id)
  )
    return null;

  const targetDayItems = sortedTargetDayItemsExcluding(
    current.itineraryItems,
    targetItem.planVariantId,
    targetItem.day,
    draggedItemId,
  );
  const targetIndex = targetDayItems.findIndex(
    (item) => item.id === targetItemId,
  );

  if (targetIndex < 0) return null;

  const nextDayItems = renumberItineraryDayItems([
    ...targetDayItems.slice(0, targetIndex),
    {
      ...draggedItem,
      day: targetItem.day,
      parentItemId: nextParentItemId,
      updatedAt,
      version: draggedItem.version + 1,
    },
    ...targetDayItems.slice(targetIndex),
  ]);

  return {
    ...current,
    itineraryItems: mergeItineraryDayItems(current.itineraryItems, nextDayItems),
  };
}

export function moveTripItemToDay(
  current: Trip,
  draggedItemId: string,
  targetDay: string,
  planVariantId: string,
  updatedAt: string,
): Trip | null {
  const draggedItem = findItineraryItemById(current.itineraryItems, draggedItemId);
  if (!draggedItem || draggedItem.planVariantId !== planVariantId) return null;

  const targetDayItems = sortedTargetDayItemsExcluding(
    current.itineraryItems,
    draggedItem.planVariantId,
    targetDay,
    draggedItemId,
  );
  const nextDayItems = renumberItineraryDayItems([
    ...targetDayItems,
    {
      ...draggedItem,
      day: targetDay,
      parentItemId: null,
      updatedAt,
      version: draggedItem.version + 1,
    },
  ]);

  return {
    ...current,
    itineraryItems: mergeItineraryDayItems(current.itineraryItems, nextDayItems),
  };
}

export function moveTripItemIntoPlanBlock(
  current: Trip,
  draggedItemId: string,
  planBlockItemId: string,
  planVariantId: string,
  updatedAt: string,
): Trip | null {
  const draggedItem = findItineraryItemById(current.itineraryItems, draggedItemId);
  const planBlock = findItineraryItemById(current.itineraryItems, planBlockItemId);
  if (
    !draggedItem ||
    !planBlock ||
    !planBlock.isPlanBlock ||
    draggedItem.isPlanBlock ||
    draggedItem.id === planBlock.id ||
    draggedItem.planVariantId !== planVariantId ||
    planBlock.planVariantId !== planVariantId ||
    hasDescendantItem(current.itineraryItems, draggedItem.id, planBlock.id)
  )
    return null;

  const targetDayItems = sortedTargetDayItemsExcluding(
    current.itineraryItems,
    planBlock.planVariantId,
    planBlock.day,
    draggedItemId,
  );
  const blockIndex = targetDayItems.findIndex(
    (item) => item.id === planBlockItemId,
  );
  if (blockIndex < 0) return null;
  const childCount = targetDayItems.filter(
    (item) => item.parentItemId === planBlockItemId,
  ).length;
  const insertIndex = blockIndex + childCount + 1;
  const nextDayItems = renumberItineraryDayItems([
    ...targetDayItems.slice(0, insertIndex),
    {
      ...draggedItem,
      day: planBlock.day,
      parentItemId: planBlock.id,
      updatedAt,
      version: draggedItem.version + 1,
    },
    ...targetDayItems.slice(insertIndex),
  ]);

  return {
    ...current,
    itineraryItems: mergeItineraryDayItems(current.itineraryItems, nextDayItems),
  };
}

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
