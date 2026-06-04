import { mainItineraryPathId, parseTime } from "./itinerary";
import type { ItineraryExportItem } from "./itinerary-import-export";
import type { ItineraryItem, ItineraryPath, ItineraryPathScope, Trip } from "./types";

export interface ItineraryImportApplyTarget {
  memberId: string;
  pathId: string;
  pathName: string;
  scope: ItineraryPathScope;
  day?: string;
  mode: "keep-alternatives" | "replace-target";
}

const importMutationTimestamp = "2026-06-04T00:00:00.000Z";

export function applyImportedItemsToItineraryPath(
  trip: Trip,
  importedItems: ItineraryExportItem[],
  target: ItineraryImportApplyTarget,
): Trip {
  const targetDay = target.scope === "day" ? target.day : undefined;
  const retainedItems = target.mode === "replace-target"
    ? trip.itineraryItems.filter((item) => !isTargetPathItem(item, target.pathId, targetDay))
    : trip.itineraryItems;
  const itemsWithMainGroups = ensureOverlappingMainGroups(retainedItems, importedItems, targetDay);
  const usedIds = new Set(itemsWithMainGroups.map((item) => item.id));
  const nextImportedItems = importedItems.map((item, index) => {
    const id = nextUniqueImportedItemId(item.id, usedIds);
    usedIds.add(id);
    const day = targetDay ?? item.day;
    const matchedMain = findOverlappingMainItem(itemsWithMainGroups, { ...item, day });
    const pathGroupId = matchedMain?.pathGroupId ?? item.pathGroupId ?? `path-group-${id}`;
    return {
      ...item,
      id,
      tripId: trip.id,
      planVariantId: trip.activePlanVariantId,
      pathGroupId,
      pathId: target.pathId === mainItineraryPathId ? undefined : target.pathId,
      pathName: target.pathId === mainItineraryPathId ? undefined : target.pathName,
      pathRole: target.pathId === mainItineraryPathId ? "main" : "alternative",
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
    itineraryItems: [...itemsWithMainGroups, ...nextImportedItems],
    version: (trip.version ?? 0) + 1,
  };
}

function ensureOverlappingMainGroups(items: ItineraryItem[], importedItems: ItineraryExportItem[], targetDay?: string): ItineraryItem[] {
  return items.map((item) => {
    if (!isMainPathItem(item) || item.pathGroupId) return item;
    const overlapsImport = importedItems.some((importedItem) => overlapsItem(item, { ...importedItem, day: targetDay ?? importedItem.day }));
    return overlapsImport ? { ...item, pathGroupId: `path-group-${item.id}`, pathRole: "main" } : item;
  });
}

function findOverlappingMainItem(items: ItineraryItem[], importedItem: Pick<ItineraryItem, "day" | "startTime" | "durationMinutes">): ItineraryItem | undefined {
  return items.find((item) => isMainPathItem(item) && overlapsItem(item, importedItem));
}

function overlapsItem(left: Pick<ItineraryItem, "day" | "startTime" | "durationMinutes">, right: Pick<ItineraryItem, "day" | "startTime" | "durationMinutes">): boolean {
  if (left.day !== right.day) return false;
  const leftStart = parseTime(left.startTime);
  const rightStart = parseTime(right.startTime);
  if (leftStart === null || rightStart === null) return left.startTime === right.startTime;
  const leftEnd = leftStart + (left.durationMinutes ?? 45);
  const rightEnd = rightStart + (right.durationMinutes ?? 45);
  return rightStart < leftEnd && leftStart < rightEnd;
}

function ensureItineraryPath(trip: Trip, target: ItineraryImportApplyTarget): ItineraryPath[] | undefined {
  if (target.pathId === mainItineraryPathId) return trip.itineraryPaths;
  const paths = trip.itineraryPaths ?? [];
  const existing = paths.find((path) => path.id === target.pathId);
  if (existing) return paths.map((path) => (path.id === target.pathId ? { ...path, name: target.pathName, scope: target.scope, day: target.day, updatedAt: importMutationTimestamp } : path));
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

function isTargetPathItem(item: ItineraryItem, pathId: string, day?: string): boolean {
  if (day && item.day !== day) return false;
  if (pathId === mainItineraryPathId) return isMainPathItem(item);
  return item.pathRole === "alternative" && item.pathId === pathId;
}

function isMainPathItem(item: ItineraryItem): boolean {
  return item.pathRole !== "alternative";
}

function nextUniqueImportedItemId(preferredId: string, usedIds: Set<string>): string {
  if (!usedIds.has(preferredId)) return preferredId;
  let suffix = 2;
  while (usedIds.has(`${preferredId}-${suffix}`)) suffix += 1;
  return `${preferredId}-${suffix}`;
}
