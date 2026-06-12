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

export interface ItineraryActivityBranchPlacement {
  trip: Trip;
  item: ItineraryItem;
  changedExistingItems: ItineraryItem[];
}

export interface ManualActivityPathOption {
  id: string;
  name: string;
}

const importMutationTimestamp = "2026-06-04T00:00:00.000Z";

export function applyItemToActivityBranch(trip: Trip, item: ItineraryItem): ItineraryActivityBranchPlacement {
  const existingItems = trip.itineraryItems.filter((candidate) => candidate.id !== item.id);
  const mainItem = { ...item, pathRole: item.pathRole ?? ("main" as const) };
  return buildActivityBranchPlacement(trip, mainItem, [mainItem], [...existingItems, mainItem]);
}

export function applyManualActivityPath(trip: Trip, itemId: string, targetPathId: string): ItineraryActivityBranchPlacement {
  const item = trip.itineraryItems.find((candidate) => candidate.id === itemId);
  if (!item) return { trip, item: trip.itineraryItems[0] as ItineraryItem, changedExistingItems: [] };

  const branchItems = sortBranchItems(findOverlappingActivityBranch(trip.itineraryItems, item));
  const pathGroupId = item.pathGroupId ?? branchItems.find((candidate) => candidate.pathGroupId)?.pathGroupId ?? `path-group-${branchItems[0]?.id ?? item.id}`;
  const currentPath = pathFieldsForManualTarget(item.day, itineraryItemPathId(item));
  const targetPath = pathFieldsForManualTarget(item.day, targetPathId);
  const nextItemsById = new Map<string, ItineraryItem>();
  const targetOccupant = branchItems.find((candidate) => candidate.id !== item.id && itineraryItemPathId(candidate) === targetPathId);

  nextItemsById.set(item.id, { ...item, ...targetPath, pathGroupId });

  if (targetPathId === mainItineraryPathId) {
    const currentPathId = currentPath.pathId ?? nextAvailableSubPath(item.day, new Set(branchItems.map((candidate) => candidate.pathId).filter((pathId): pathId is string => Boolean(pathId))), 0).pathId;
    const previousMain = branchItems.find((candidate) => candidate.id !== item.id && itineraryItemPathId(candidate) === mainItineraryPathId);
    if (previousMain) {
      nextItemsById.set(previousMain.id, { ...previousMain, ...pathFieldsForManualTarget(previousMain.day, currentPathId), pathGroupId });
    }
  } else if (targetOccupant) {
    nextItemsById.set(targetOccupant.id, { ...targetOccupant, ...currentPath, pathGroupId });
  } else if (itineraryItemPathId(item) === mainItineraryPathId) {
    const nextMain = branchItems.find((candidate) => candidate.id !== item.id);
    if (nextMain) {
      nextItemsById.set(nextMain.id, { ...nextMain, ...pathFieldsForManualTarget(nextMain.day, mainItineraryPathId), pathGroupId });
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
  return buildActivityBranchPlacement(trip, nextItem, branchItemsWithChildren, trip.itineraryItems);
}

export function deriveManualActivityPathOptions(trip: Trip, itemId: string): ManualActivityPathOption[] {
  const item = trip.itineraryItems.find((candidate) => candidate.id === itemId);
  if (!item) return [{ id: mainItineraryPathId, name: "Main" }];
  const branchItems = findOverlappingActivityBranch(trip.itineraryItems, item);
  const options = new Map<string, ManualActivityPathOption>([[mainItineraryPathId, { id: mainItineraryPathId, name: "Main" }]]);
  for (const branchItem of sortBranchItems(branchItems)) {
    if (branchItem.pathRole === "alternative" && branchItem.pathId) {
      options.set(branchItem.pathId, { id: branchItem.pathId, name: branchItem.pathName ?? subPathNameFromId(branchItem.pathId) });
    }
  }
  const usedPathIds = new Set(Array.from(options.keys()));
  let index = 0;
  while (options.size < Math.max(2, branchItems.length + 1)) {
    const subPath = nextAvailableSubPath(item.day, usedPathIds, index);
    options.set(subPath.pathId, { id: subPath.pathId, name: subPath.pathName });
    usedPathIds.add(subPath.pathId);
    index = subPathIndexFromId(subPath.pathId) + 1;
  }
  return Array.from(options.values());
}

export function applyImportedItemsToItineraryPath(
  trip: Trip,
  importedItems: ItineraryExportItem[],
  target: ItineraryImportApplyTarget,
): Trip {
  const targetDay = target.scope === "day" ? target.day : undefined;
  const retainedItems = target.mode === "replace-target"
    ? trip.itineraryItems.filter((item) => !isTargetPathItem(item, target.pathId, targetDay))
    : trip.itineraryItems;
  const usedIds = new Set(retainedItems.map((item) => item.id));
  const nextImportedItems = importedItems.map((item, index) => {
    const id = nextUniqueImportedItemId(item.id, usedIds);
    usedIds.add(id);
    const day = targetDay ?? item.day;
    const pathGroupId = target.pathId === mainItineraryPathId
      ? undefined
      : item.pathGroupId ?? `path-group-${id}`;
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
    itineraryItems: [...retainedItems, ...nextImportedItems],
    version: (trip.version ?? 0) + 1,
  };
}

function findOverlappingActivityBranch(items: ItineraryItem[], item: ItineraryItem): ItineraryItem[] {
  const branchItemsById = new Map<string, ItineraryItem>([[item.id, item]]);
  let added = true;
  while (added) {
    added = false;
    for (const candidate of items) {
      if (candidate.day !== item.day || candidate.planVariantId !== item.planVariantId || branchItemsById.has(candidate.id)) continue;
      const overlapsBranch = Array.from(branchItemsById.values()).some((branchItem) => overlapsItem(branchItem, candidate));
      if (overlapsBranch) {
        branchItemsById.set(candidate.id, candidate);
        added = true;
      }
    }
  }
  return Array.from(branchItemsById.values());
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

function sortBranchItems(items: ItineraryItem[]): ItineraryItem[] {
  return [...items].sort((left, right) => {
    const leftStart = parseTime(left.startTime);
    const rightStart = parseTime(right.startTime);
    const timeCompare = (leftStart ?? Number.MAX_SAFE_INTEGER) - (rightStart ?? Number.MAX_SAFE_INTEGER);
    if (timeCompare !== 0) return timeCompare;
    return left.sortOrder - right.sortOrder || left.id.localeCompare(right.id);
  });
}

function cascadePathFieldsToSubActivities(
  allItems: ItineraryItem[],
  branchItems: ItineraryItem[],
): ItineraryItem[] {
  const nextItemsById = new Map(branchItems.map((branchItem) => [branchItem.id, branchItem]));
  for (const branchItem of branchItems) {
    const subActivities = allItems.filter((item) => item.parentItemId === branchItem.id);
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

function buildActivityBranchPlacement(
  trip: Trip,
  item: ItineraryItem,
  branchItems: ItineraryItem[],
  inputItems: ItineraryItem[],
): ItineraryActivityBranchPlacement {
  const branchItemsById = new Map(branchItems.map((branchItem) => [branchItem.id, branchItem]));
  const nextItems = inputItems.map((candidate) => branchItemsById.get(candidate.id) ?? candidate);
  const existingItemsById = new Map(trip.itineraryItems.map((candidate) => [candidate.id, candidate]));
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

function itineraryItemPathId(item: ItineraryItem): string {
  return item.pathRole === "alternative" ? item.pathId ?? item.id : mainItineraryPathId;
}

function pathFieldsForManualTarget(day: string, pathId: string): Pick<ItineraryItem, "pathId" | "pathName" | "pathRole"> {
  if (pathId === mainItineraryPathId) return { pathId: undefined, pathName: undefined, pathRole: "main" };
  return { pathId, pathName: subPathNameFromId(pathId) || subPathForIndex(day, 0).pathName, pathRole: "alternative" };
}

function nextAvailableSubPath(day: string, usedPathIds: Set<string>, startIndex: number): { pathId: string; pathName: string } {
  let index = startIndex;
  let path = subPathForIndex(day, index);
  while (usedPathIds.has(path.pathId)) {
    index += 1;
    path = subPathForIndex(day, index);
  }
  return path;
}

function subPathForIndex(day: string, index: number): { pathId: string; pathName: string } {
  const label = subPathLabel(index);
  return {
    pathId: `path-${day}-sub-${label.toLowerCase()}`,
    pathName: `Plan ${label}`,
  };
}

function subPathLabel(index: number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (index < letters.length) return letters[index] ?? "A";
  const prefix = letters[Math.floor(index / letters.length) - 1] ?? "Z";
  const suffix = letters[index % letters.length] ?? "Z";
  return `${prefix}${suffix}`;
}

function subPathIndexFromId(pathId: string): number {
  const match = pathId.match(/-sub-([a-z]+)$/i);
  if (!match) return -1;
  const value = match[1]?.toUpperCase() ?? "";
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (value.length === 1) return letters.indexOf(value);
  if (value.length === 2) return (letters.indexOf(value[0] ?? "A") + 1) * letters.length + letters.indexOf(value[1] ?? "A");
  return -1;
}

function subPathNameFromId(pathId: string): string {
  const index = subPathIndexFromId(pathId);
  return index >= 0 ? `Plan ${subPathLabel(index)}` : pathId;
}

function samePathFields(left: ItineraryItem, right: ItineraryItem): boolean {
  return left.pathGroupId === right.pathGroupId
    && left.pathId === right.pathId
    && left.pathName === right.pathName
    && left.pathRole === right.pathRole;
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
