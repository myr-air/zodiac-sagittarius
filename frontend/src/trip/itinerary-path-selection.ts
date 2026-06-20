import type { ItineraryItem } from "./types";
import { itineraryItemPathId } from "./itinerary-path-identifiers";
import {
  mainItineraryPathId,
} from "./itinerary-path-identifiers";
import { sortItineraryItemsByDayAndHierarchy } from "./itinerary-item-ordering";

export interface ItineraryPathSelection {
  tripPathId?: string;
  dayPathOverrides?: Record<string, string | undefined>;
  showAll?: boolean;
}

export type ItineraryPathSelectionAction =
  | { type: "change-trip-path"; pathId: string }
  | { type: "change-day-path"; day: string; pathId: string }
  | { type: "clear-day-path"; day: string }
  | { type: "clear-all-day-paths" }
  | { type: "toggle-show-all-paths"; showAll: boolean };

export function resolveItineraryPathItems(
  items: ItineraryItem[],
  selection: ItineraryPathSelection = {},
): ItineraryItem[] {
  if (selection.showAll) return sortItineraryItemsByDayAndHierarchy(items);

  const groups = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    const groupKey = itineraryPathGroupKey(item);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), item]);
  }

  const visibleItems: ItineraryItem[] = [];
  for (const groupItems of groups.values()) {
    if (!itineraryPathGroupHasAlternatives(groupItems)) {
      visibleItems.push(...groupItems);
      continue;
    }

    const day = groupItems[0]?.day ?? "";
    const selectedPathId =
      selectedItineraryPathIdForDay(day, selection);
    const selected = groupItems.find(
      (item) => itineraryItemPathId(item) === selectedPathId,
    );
    const main = groupItems.find(
      (item) => itineraryItemPathId(item) === mainItineraryPathId,
    );
    const fallback = groupItems[0];
    if (selected) {
      visibleItems.push(selected);
    } else if (main) {
      visibleItems.push(main);
    } else if (fallback) {
      visibleItems.push(fallback);
    }
  }

  return sortItineraryItemsByDayAndHierarchy(visibleItems);
}

export function updateItineraryPathSelection(
  current: ItineraryPathSelection,
  action: ItineraryPathSelectionAction,
): ItineraryPathSelection {
  switch (action.type) {
    case "change-trip-path":
      return {
        ...current,
        tripPathId: action.pathId,
        showAll: false,
      };
    case "change-day-path":
      return {
        ...current,
        showAll: false,
        dayPathOverrides: {
          ...(current.dayPathOverrides ?? {}),
          [action.day]: action.pathId === mainItineraryPathId ? undefined : action.pathId,
        },
      };
    case "clear-day-path":
      return {
        ...current,
        dayPathOverrides: {
          ...(current.dayPathOverrides ?? {}),
          [action.day]: undefined,
        },
      };
    case "clear-all-day-paths":
      return { ...current, dayPathOverrides: {} };
    case "toggle-show-all-paths":
      return { ...current, showAll: action.showAll };
  }
}

export function selectedItineraryPathIdForDay(
  day: string,
  selection: ItineraryPathSelection,
): string {
  if (selection.showAll) return mainItineraryPathId;
  return (
    selection.dayPathOverrides?.[day] ||
    selection.tripPathId ||
    mainItineraryPathId
  );
}

export function itineraryItemPathFieldsForTarget(
  pathGroupId: string,
  pathId: string,
  pathName?: string,
): Pick<
  ItineraryItem,
  "pathGroupId" | "pathId" | "pathName" | "pathRole"
> {
  if (pathId === mainItineraryPathId) {
    return { pathGroupId, pathRole: "main" };
  }
  return { pathGroupId, pathId, pathName, pathRole: "alternative" };
}

function itineraryPathGroupKey(item: ItineraryItem): string {
  return item.pathGroupId || `${item.day}:${item.startTime}:${item.sortOrder}:${item.id}`;
}

function itineraryPathGroupHasAlternatives(items: ItineraryItem[]): boolean {
  return items.some((item) => item.pathRole === "alternative" || Boolean(item.pathId));
}
