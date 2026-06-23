import {
  findOverlappingActivityBranch,
  sortBranchItems,
} from "./itinerary-activity-branch-detection";
import {
  buildManualActivityPathOptions,
  nextAvailableSubPath,
  pathFieldsForManualTarget,
  type ManualActivityPathOption,
} from "./itinerary-activity-branch-paths";
import {
  buildActivityBranchPlacement,
  cascadePathFieldsToSubActivities,
  type ItineraryActivityBranchPlacement,
} from "./itinerary-activity-branch-placement";
import {
  itineraryItemPathId,
  mainItineraryPathId,
  mainItineraryPathName,
} from "./itinerary-path-identifiers";
import { findItineraryItemById } from "../itinerary-items/itinerary-item-lookup";
import type { ItineraryItem, Trip } from "../types";

export type { ItineraryActivityBranchPlacement } from "./itinerary-activity-branch-placement";
export type { ManualActivityPathOption } from "./itinerary-activity-branch-paths";

export function applyItemToActivityBranch(
  trip: Trip,
  item: ItineraryItem,
): ItineraryActivityBranchPlacement {
  const existingItems = trip.itineraryItems.filter(
    (candidate) => candidate.id !== item.id,
  );
  const mainItem = { ...item, pathRole: item.pathRole ?? ("main" as const) };
  return buildActivityBranchPlacement(
    trip,
    mainItem,
    [mainItem],
    [...existingItems, mainItem],
  );
}

export function applyManualActivityPath(
  trip: Trip,
  itemId: string,
  targetPathId: string,
): ItineraryActivityBranchPlacement {
  const item = findItineraryItemById(trip.itineraryItems, itemId);
  if (!item)
    return { trip, item: trip.itineraryItems[0] as ItineraryItem, changedExistingItems: [] };

  const branchItems = sortBranchItems(findOverlappingActivityBranch(trip.itineraryItems, item));
  const pathGroupId =
    item.pathGroupId ??
    branchItems.find((candidate) => candidate.pathGroupId)?.pathGroupId ??
    `path-group-${branchItems[0]?.id ?? item.id}`;
  const currentPath = pathFieldsForManualTarget(item.day, itineraryItemPathId(item));
  const targetPath = pathFieldsForManualTarget(item.day, targetPathId);
  const nextItemsById = new Map<string, ItineraryItem>();
  const targetOccupant = branchItems.find(
    (candidate) =>
      candidate.id !== item.id && itineraryItemPathId(candidate) === targetPathId,
  );

  nextItemsById.set(item.id, { ...item, ...targetPath, pathGroupId });

  if (targetPathId === mainItineraryPathId) {
    const currentPathId =
      currentPath.pathId ??
      nextAvailableSubPath(
        item.day,
        new Set(
          branchItems
            .map((candidate) => candidate.pathId)
            .filter((pathId): pathId is string => Boolean(pathId)),
        ),
        0,
      ).pathId;
    const previousMain = branchItems.find(
      (candidate) =>
        candidate.id !== item.id &&
        itineraryItemPathId(candidate) === mainItineraryPathId,
    );
    if (previousMain) {
      nextItemsById.set(previousMain.id, {
        ...previousMain,
        ...pathFieldsForManualTarget(previousMain.day, currentPathId),
        pathGroupId,
      });
    }
  } else if (targetOccupant) {
    nextItemsById.set(targetOccupant.id, {
      ...targetOccupant,
      ...currentPath,
      pathGroupId,
    });
  } else if (itineraryItemPathId(item) === mainItineraryPathId) {
    const nextMain = branchItems.find((candidate) => candidate.id !== item.id);
    if (nextMain) {
      nextItemsById.set(nextMain.id, {
        ...nextMain,
        ...pathFieldsForManualTarget(nextMain.day, mainItineraryPathId),
        pathGroupId,
      });
    }
  }

  const normalizedBranchItems = branchItems.map((branchItem) => {
    const nextItem = nextItemsById.get(branchItem.id);
    if (nextItem) return nextItem;
    if (branchItem.pathGroupId === pathGroupId) return branchItem;
    return { ...branchItem, pathGroupId };
  });
  const branchItemsWithChildren = cascadePathFieldsToSubActivities(
    trip.itineraryItems,
    normalizedBranchItems,
  );
  const nextItem = nextItemsById.get(item.id) ?? item;
  return buildActivityBranchPlacement(
    trip,
    nextItem,
    branchItemsWithChildren,
    trip.itineraryItems,
  );
}

export function deriveManualActivityPathOptions(
  trip: Trip,
  itemId: string,
): ManualActivityPathOption[] {
  const item = findItineraryItemById(trip.itineraryItems, itemId);
  if (!item) return [{ id: mainItineraryPathId, name: mainItineraryPathName }];
  return buildManualActivityPathOptions(
    item.day,
    sortBranchItems(findOverlappingActivityBranch(trip.itineraryItems, item)),
  );
}
