import type {
  ItineraryItem,
  Trip,
} from "./types";

export interface ItineraryItemPlacement {
  trip: Trip;
  item: ItineraryItem;
  changedExistingItems: ItineraryItem[];
}

export function appendItineraryItemToTrip(
  trip: Trip,
  item: ItineraryItem,
): Trip {
  return {
    ...trip,
    itineraryItems: [...trip.itineraryItems, item],
  };
}

export function appendItineraryItemPlacement(
  trip: Trip,
  item: ItineraryItem,
): ItineraryItemPlacement {
  return {
    trip: appendItineraryItemToTrip(trip, item),
    item,
    changedExistingItems: [],
  };
}

export function mergeCreatedItineraryItemIntoTrip(
  trip: Trip,
  createdItem: ItineraryItem,
  placement: Pick<ItineraryItemPlacement, "item">,
  patchedBranchItems: ItineraryItem[],
): Trip {
  const createdItemWithPath = {
    ...createdItem,
    pathGroupId: placement.item.pathGroupId,
    pathId: placement.item.pathId,
    pathName: placement.item.pathName,
    pathRole: placement.item.pathRole,
  };
  const patchedBranchItemsById = new Map(
    patchedBranchItems.map((item) => [item.id, item]),
  );

  return {
    ...trip,
    itineraryItems: [
      ...trip.itineraryItems.map(
        (item) => patchedBranchItemsById.get(item.id) ?? item,
      ),
      createdItemWithPath,
    ],
  };
}

export function mergeUpdatedItineraryBranchIntoTrip(
  trip: Trip,
  itemId: string,
  placement: ItineraryItemPlacement,
  patchedBranchItems: ItineraryItem[],
): Trip {
  const patchedBranchItemsById = new Map(
    patchedBranchItems.map((item) => [item.id, item]),
  );
  const changedItemIds = new Set(
    placement.changedExistingItems.map((item) => item.id),
  );
  const branchPlacementItemsById = new Map(
    placement.trip.itineraryItems
      .filter((item) => changedItemIds.has(item.id))
      .map((item) => [item.id, item]),
  );

  return {
    ...trip,
    itineraryItems: trip.itineraryItems.map((item) => {
      if (patchedBranchItemsById.has(item.id))
        return patchedBranchItemsById.get(item.id) ?? item;
      if (branchPlacementItemsById.has(item.id))
        return branchPlacementItemsById.get(item.id) ?? item;
      return item.id === itemId ? placement.item : item;
    }),
  };
}

export function replaceItineraryItem(
  current: Trip,
  updatedItem: ItineraryItem,
): Trip {
  return replaceItineraryItems(current, [updatedItem]);
}

export function replaceItineraryItems(
  current: Trip,
  updatedItems: ItineraryItem[],
): Trip {
  const updatedItemsById = new Map(updatedItems.map((item) => [item.id, item]));
  return {
    ...current,
    itineraryItems: current.itineraryItems.map((item) =>
      updatedItemsById.get(item.id) ?? item,
    ),
  };
}

export function deleteItineraryItemFromTrip(
  current: Trip,
  itemId: string,
): Trip {
  return {
    ...current,
    itineraryItems: current.itineraryItems.filter((item) => item.id !== itemId),
    expenses: current.expenses.filter(
      (expense) => expense.itineraryItemId !== itemId,
    ),
  };
}
