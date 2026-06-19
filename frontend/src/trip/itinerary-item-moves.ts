import {
  compareItineraryItemsWithinDay,
} from "./itinerary-item-ordering";
import type {
  ItineraryItem,
  Trip,
} from "./types";

export function moveTripItem(
  current: Trip,
  draggedItemId: string,
  targetItemId: string,
  planVariantId: string,
  updatedAt: string,
): Trip | null {
  const draggedItem = current.itineraryItems.find(
    (item) => item.id === draggedItemId,
  );
  const targetItem = current.itineraryItems.find(
    (item) => item.id === targetItemId,
  );

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

  const targetDayItems = current.itineraryItems
    .filter(
      (item) =>
        item.planVariantId === targetItem.planVariantId &&
        item.day === targetItem.day &&
        item.id !== draggedItemId,
    )
    .sort(compareItineraryItemsWithinDay);
  const targetIndex = targetDayItems.findIndex(
    (item) => item.id === targetItemId,
  );

  if (targetIndex < 0) return null;

  const nextDayItems = [
    ...targetDayItems.slice(0, targetIndex),
    {
      ...draggedItem,
      day: targetItem.day,
      parentItemId: nextParentItemId,
      updatedAt,
      version: draggedItem.version + 1,
    },
    ...targetDayItems.slice(targetIndex),
  ].map((item, index) => ({ ...item, sortOrder: (index + 1) * 100 }));
  const nextItemsById = new Map(nextDayItems.map((item) => [item.id, item]));

  return {
    ...current,
    itineraryItems: current.itineraryItems.map(
      (item) => nextItemsById.get(item.id) ?? item,
    ),
  };
}

export function moveTripItemToDay(
  current: Trip,
  draggedItemId: string,
  targetDay: string,
  planVariantId: string,
  updatedAt: string,
): Trip | null {
  const draggedItem = current.itineraryItems.find(
    (item) => item.id === draggedItemId,
  );
  if (!draggedItem || draggedItem.planVariantId !== planVariantId) return null;

  const targetDayItems = current.itineraryItems
    .filter(
      (item) =>
        item.planVariantId === draggedItem.planVariantId &&
        item.day === targetDay &&
        item.id !== draggedItemId,
    )
    .sort(compareItineraryItemsWithinDay);
  const nextDayItems = [
    ...targetDayItems,
    {
      ...draggedItem,
      day: targetDay,
      parentItemId: null,
      updatedAt,
      version: draggedItem.version + 1,
    },
  ].map((item, index) => ({ ...item, sortOrder: (index + 1) * 100 }));
  const nextItemsById = new Map(nextDayItems.map((item) => [item.id, item]));

  return {
    ...current,
    itineraryItems: current.itineraryItems.map(
      (item) => nextItemsById.get(item.id) ?? item,
    ),
  };
}

export function moveTripItemIntoPlanBlock(
  current: Trip,
  draggedItemId: string,
  planBlockItemId: string,
  planVariantId: string,
  updatedAt: string,
): Trip | null {
  const draggedItem = current.itineraryItems.find(
    (item) => item.id === draggedItemId,
  );
  const planBlock = current.itineraryItems.find(
    (item) => item.id === planBlockItemId,
  );
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

  const targetDayItems = current.itineraryItems
    .filter(
      (item) =>
        item.planVariantId === planBlock.planVariantId &&
        item.day === planBlock.day &&
        item.id !== draggedItemId,
    )
    .sort(compareItineraryItemsWithinDay);
  const blockIndex = targetDayItems.findIndex(
    (item) => item.id === planBlockItemId,
  );
  if (blockIndex < 0) return null;
  const childCount = targetDayItems.filter(
    (item) => item.parentItemId === planBlockItemId,
  ).length;
  const insertIndex = blockIndex + childCount + 1;
  const nextDayItems = [
    ...targetDayItems.slice(0, insertIndex),
    {
      ...draggedItem,
      day: planBlock.day,
      parentItemId: planBlock.id,
      updatedAt,
      version: draggedItem.version + 1,
    },
    ...targetDayItems.slice(insertIndex),
  ].map((item, index) => ({ ...item, sortOrder: (index + 1) * 100 }));
  const nextItemsById = new Map(nextDayItems.map((item) => [item.id, item]));

  return {
    ...current,
    itineraryItems: current.itineraryItems.map(
      (item) => nextItemsById.get(item.id) ?? item,
    ),
  };
}

export function hasDescendantItem(
  items: ItineraryItem[],
  parentItemId: string,
  candidateItemId: string,
): boolean {
  let currentItem = items.find((item) => item.id === candidateItemId);
  while (currentItem?.parentItemId) {
    if (currentItem.parentItemId === parentItemId) return true;
    currentItem = items.find((item) => item.id === currentItem?.parentItemId);
  }
  return false;
}
