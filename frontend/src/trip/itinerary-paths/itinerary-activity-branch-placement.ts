import type { ItineraryItem, Trip } from "../types";

export interface ItineraryActivityBranchPlacement {
  trip: Trip;
  item: ItineraryItem;
  changedExistingItems: ItineraryItem[];
}

export function cascadePathFieldsToSubActivities(
  allItems: ItineraryItem[],
  branchItems: ItineraryItem[],
): ItineraryItem[] {
  const nextItemsById = new Map(
    branchItems.map((branchItem) => [branchItem.id, branchItem]),
  );
  for (const branchItem of branchItems) {
    const subActivities = allItems.filter(
      (item) => item.parentItemId === branchItem.id,
    );
    for (const subActivity of subActivities) {
      nextItemsById.set(subActivity.id, {
        ...subActivity,
        pathGroupId: branchItem.pathGroupId,
        pathId: branchItem.pathId,
        pathName: branchItem.pathName,
        pathRole: branchItem.pathRole,
      });
    }
  }
  return Array.from(nextItemsById.values());
}

export function buildActivityBranchPlacement(
  trip: Trip,
  item: ItineraryItem,
  branchItems: ItineraryItem[],
  inputItems: ItineraryItem[],
): ItineraryActivityBranchPlacement {
  const branchItemsById = new Map(
    branchItems.map((branchItem) => [branchItem.id, branchItem]),
  );
  const nextItems = inputItems.map(
    (candidate) => branchItemsById.get(candidate.id) ?? candidate,
  );
  const existingItemsById = new Map(
    trip.itineraryItems.map((candidate) => [candidate.id, candidate]),
  );
  const changedExistingItems = nextItems.filter((candidate) => {
    const existing = existingItemsById.get(candidate.id);
    return existing ? !samePathFields(existing, candidate) : false;
  });
  return {
    trip: {
      ...trip,
      itineraryItems: nextItems,
      version: (trip.version ?? 0) + 1,
    },
    item,
    changedExistingItems,
  };
}

function samePathFields(left: ItineraryItem, right: ItineraryItem): boolean {
  return (
    left.pathGroupId === right.pathGroupId &&
    left.pathId === right.pathId &&
    left.pathName === right.pathName &&
    left.pathRole === right.pathRole
  );
}
