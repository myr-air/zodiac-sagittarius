import {
  mainItineraryPathId,
  mainItineraryPathName,
} from "./itinerary-path-identifiers";
import type { ItineraryItem } from "./types";

export interface ManualActivityPathOption {
  id: string;
  name: string;
}

export function pathFieldsForManualTarget(
  day: string,
  pathId: string,
): Pick<ItineraryItem, "pathId" | "pathName" | "pathRole"> {
  if (pathId === mainItineraryPathId)
    return { pathId: undefined, pathName: undefined, pathRole: "main" };
  return {
    pathId,
    pathName: subPathNameFromId(pathId) || subPathForIndex(day, 0).pathName,
    pathRole: "alternative",
  };
}

export function buildManualActivityPathOptions(
  day: string,
  branchItems: ItineraryItem[],
): ManualActivityPathOption[] {
  const options = new Map<string, ManualActivityPathOption>([
    [mainItineraryPathId, { id: mainItineraryPathId, name: mainItineraryPathName }],
  ]);
  for (const branchItem of branchItems) {
    if (branchItem.pathRole === "alternative" && branchItem.pathId) {
      options.set(branchItem.pathId, {
        id: branchItem.pathId,
        name: branchItem.pathName ?? subPathNameFromId(branchItem.pathId),
      });
    }
  }
  const usedPathIds = new Set(Array.from(options.keys()));
  let index = 0;
  while (options.size < Math.max(2, branchItems.length + 1)) {
    const subPath = nextAvailableSubPath(day, usedPathIds, index);
    options.set(subPath.pathId, { id: subPath.pathId, name: subPath.pathName });
    usedPathIds.add(subPath.pathId);
    index = subPathIndexFromId(subPath.pathId) + 1;
  }
  return Array.from(options.values());
}

export function nextAvailableSubPath(
  day: string,
  usedPathIds: Set<string>,
  startIndex: number,
): { pathId: string; pathName: string } {
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
  if (value.length === 2)
    return (
      (letters.indexOf(value[0] ?? "A") + 1) * letters.length +
      letters.indexOf(value[1] ?? "A")
    );
  return -1;
}

function subPathNameFromId(pathId: string): string {
  const index = subPathIndexFromId(pathId);
  return index >= 0 ? `Plan ${subPathLabel(index)}` : pathId;
}
