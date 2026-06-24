import { itineraryItemPathFieldsForTarget } from "../itinerary-paths";
import type { ItineraryItem } from "../types";

export function itineraryItemDraftPathFields({
  nextItemId,
  parentItem,
  pathId,
  pathName,
}: {
  nextItemId: string;
  parentItem?: ItineraryItem;
  pathId: string;
  pathName?: string;
}): Pick<ItineraryItem, "pathGroupId" | "pathId" | "pathName" | "pathRole"> {
  if (!parentItem) {
    return itineraryItemPathFieldsForTarget(
      `path-group-${nextItemId}`,
      pathId,
      pathName,
    );
  }

  return {
    pathGroupId: parentItem.pathGroupId,
    pathId: parentItem.pathId,
    pathName: parentItem.pathName,
    pathRole: parentItem.pathRole ?? "main",
  };
}

export function normalizeStopHierarchyValues<
  T extends { parentItemId?: string | null; isPlanBlock?: boolean },
>(values: T): T {
  return values.parentItemId ? { ...values, isPlanBlock: false } : values;
}
