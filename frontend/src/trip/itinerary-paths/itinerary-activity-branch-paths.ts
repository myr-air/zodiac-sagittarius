import {
  mainItineraryPathId,
  mainItineraryPathName,
} from "./itinerary-path-identifiers";
import {
  generatedSubPathForIndex,
  generatedSubPathIndexFromId,
  generatedSubPathNameFromId,
} from "./itinerary-generated-sub-paths";
import type { ItineraryItem } from "../types";

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
    pathName:
      generatedSubPathNameFromId(pathId) ||
      generatedSubPathForIndex(day, 0).pathName,
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
        name:
          branchItem.pathName ??
          generatedSubPathNameFromId(branchItem.pathId) ??
          branchItem.pathId,
      });
    }
  }
  const usedPathIds = new Set(Array.from(options.keys()));
  let index = 0;
  while (options.size < Math.max(2, branchItems.length + 1)) {
    const subPath = nextAvailableSubPath(day, usedPathIds, index);
    options.set(subPath.pathId, { id: subPath.pathId, name: subPath.pathName });
    usedPathIds.add(subPath.pathId);
    index = generatedSubPathIndexFromId(subPath.pathId) + 1;
  }
  return Array.from(options.values());
}

export function nextAvailableSubPath(
  day: string,
  usedPathIds: Set<string>,
  startIndex: number,
): { pathId: string; pathName: string } {
  let index = startIndex;
  let path = generatedSubPathForIndex(day, index);
  while (usedPathIds.has(path.pathId)) {
    index += 1;
    path = generatedSubPathForIndex(day, index);
  }
  return path;
}
