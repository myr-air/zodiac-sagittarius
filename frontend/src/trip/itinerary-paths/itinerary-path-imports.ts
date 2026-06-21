import type { ItineraryExportItem } from "../itinerary-import-export";
import {
  mainItineraryPathId,
} from "./itinerary-path-identifiers";
import type {
  ItineraryItem,
  ItineraryPath,
  ItineraryPathScope,
  Trip,
} from "../types";

export interface ItineraryImportApplyTarget {
  memberId: string;
  tripPlanId?: string;
  pathId: string;
  pathName: string;
  scope: ItineraryPathScope;
  day?: string;
  mode: "keep-alternatives" | "replace-target";
  recordMode: "clone-linked" | "activities-only";
}

const importMutationTimestamp = "2026-06-04T00:00:00.000Z";

export function applyImportedItemsToItineraryPath(
  trip: Trip,
  importedItems: ItineraryExportItem[],
  target: ItineraryImportApplyTarget,
): Trip {
  const targetDay = target.scope === "day" ? target.day : undefined;
  const retainedItems =
    target.mode === "replace-target"
      ? trip.itineraryItems.filter(
          (item) => !isTargetPathItem(item, target.pathId, targetDay),
        )
      : trip.itineraryItems;
  const usedIds = new Set(retainedItems.map((item) => item.id));
  const importedIdMap = new Map<string, string>();
  for (const item of importedItems) {
    const id = nextUniqueImportedItemId(item.id, usedIds);
    usedIds.add(id);
    importedIdMap.set(item.id, id);
  }

  const nextImportedItems = importedItems.map((item, index) => {
    const id = importedIdMap.get(item.id) ?? item.id;
    const day = targetDay ?? item.day;
    const pathGroupId =
      target.pathId === mainItineraryPathId
        ? undefined
        : item.pathGroupId ?? `path-group-${id}`;
    return {
      ...item,
      id,
      tripId: trip.id,
      planVariantId: target.tripPlanId || trip.activePlanVariantId,
      parentItemId: item.parentItemId
        ? (importedIdMap.get(item.parentItemId) ?? item.parentItemId)
        : item.parentItemId,
      pathGroupId,
      pathId: target.pathId === mainItineraryPathId ? undefined : target.pathId,
      pathName:
        target.pathId === mainItineraryPathId ? undefined : target.pathName,
      pathRole:
        target.pathId === mainItineraryPathId ? "main" : "alternative",
      day,
      sortOrder: item.sortOrder || (index + 1) * 100,
      createdBy: target.memberId,
      updatedAt: importMutationTimestamp,
      version: 1,
    } satisfies ItineraryItem;
  });

  return {
    ...trip,
    itineraryPaths: ensureItineraryPath(trip, target),
    itineraryItems: [...retainedItems, ...nextImportedItems],
    version: (trip.version ?? 0) + 1,
  };
}

function ensureItineraryPath(
  trip: Trip,
  target: ItineraryImportApplyTarget,
): ItineraryPath[] | undefined {
  if (target.pathId === mainItineraryPathId) return trip.itineraryPaths;
  const paths = trip.itineraryPaths ?? [];
  const existing = paths.find((path) => path.id === target.pathId);
  if (existing)
    return paths.map((path) =>
      path.id === target.pathId
        ? {
            ...path,
            name: target.pathName,
            scope: target.scope,
            day: target.day,
            updatedAt: importMutationTimestamp,
          }
        : path,
    );
  return [
    ...paths,
    {
      id: target.pathId,
      tripId: trip.id,
      name: target.pathName,
      scope: target.scope,
      day: target.day,
      createdBy: target.memberId,
      createdAt: importMutationTimestamp,
      updatedAt: importMutationTimestamp,
    },
  ];
}

function isTargetPathItem(
  item: ItineraryItem,
  pathId: string,
  day?: string,
): boolean {
  if (day && item.day !== day) return false;
  if (pathId === mainItineraryPathId) return isMainPathItem(item);
  return item.pathRole === "alternative" && item.pathId === pathId;
}

function isMainPathItem(item: ItineraryItem): boolean {
  return item.pathRole !== "alternative";
}

function nextUniqueImportedItemId(
  preferredId: string,
  usedIds: Set<string>,
): string {
  if (!usedIds.has(preferredId)) return preferredId;
  let suffix = 2;
  while (usedIds.has(`${preferredId}-${suffix}`)) suffix += 1;
  return `${preferredId}-${suffix}`;
}
