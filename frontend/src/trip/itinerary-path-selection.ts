import type { ItineraryItem, ItineraryPath, ItineraryPathScope } from "./types";
import { itineraryItemPathId } from "./itinerary-path-identifiers";
import {
  mainItineraryPathId,
  mainItineraryPathName,
} from "./itinerary-path-identifiers";
import { humanizePathId } from "./itinerary-path-identifiers";

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

export interface ItineraryPathOption {
  id: string;
  name: string;
  scope: ItineraryPathScope;
  day?: string;
}

export function resolveItineraryPathItems(
  items: ItineraryItem[],
  selection: ItineraryPathSelection = {},
): ItineraryItem[] {
  if (selection.showAll) return sortItineraryItems(items);

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

  return sortItineraryItems(visibleItems);
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

export function deriveItineraryPathOptions(
  items: ItineraryItem[],
  paths: ItineraryPath[] = [],
): ItineraryPathOption[] {
  const options = new Map<string, ItineraryPathOption>();
  options.set(mainItineraryPathId, {
    id: mainItineraryPathId,
    name: mainItineraryPathName,
    scope: "trip",
  });

  for (const path of paths) {
    options.set(path.id, {
      id: path.id,
      name: path.name,
      scope: path.scope,
      day: path.day,
    });
  }

  for (const item of items) {
    if (
      item.pathRole !== "alternative" ||
      !item.pathId ||
      options.has(item.pathId)
    )
      continue;
    const generatedDay = generatedDayFromPathId(item.pathId);
    options.set(item.pathId, {
      id: item.pathId,
      name: item.pathName || humanizePathId(item.pathId),
      scope: generatedDay ? "day" : "trip",
      day: generatedDay || undefined,
    });
  }

  return Array.from(options.values());
}

export function itineraryPathOptionsForDay(
  pathOptions: ItineraryPathOption[],
  day: string,
): ItineraryPathOption[] {
  return pathOptions.filter(
    (option) =>
      option.id === mainItineraryPathId ||
      option.scope === "trip" ||
      option.day === day,
  );
}

function sortItineraryItems(items: ItineraryItem[]): ItineraryItem[] {
  const byDay = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    byDay.set(item.day, [...(byDay.get(item.day) ?? []), item]);
  }

  return Array.from(byDay.keys())
    .sort()
    .flatMap((day) =>
      orderHierarchyItemsForDay(
        (byDay.get(day) ?? []).slice().sort(compareItineraryItemsWithinDay),
      ),
    );
}

function itineraryPathGroupKey(item: ItineraryItem): string {
  return item.pathGroupId || `${item.day}:${item.startTime}:${item.sortOrder}:${item.id}`;
}

function itineraryPathGroupHasAlternatives(items: ItineraryItem[]): boolean {
  return items.some((item) => item.pathRole === "alternative" || Boolean(item.pathId));
}

function generatedDayFromPathId(pathId: string): string | null {
  const match = pathId.match(/^path-(\d{4}-\d{2}-\d{2})-sub-[a-z]+$/i);
  return match?.[1] ?? null;
}

function compareItineraryItemsWithinDay(a: ItineraryItem, b: ItineraryItem): number {
  const aFlexible = a.timeMode === "flexible";
  const bFlexible = b.timeMode === "flexible";
  if (aFlexible !== bFlexible) return aFlexible ? 1 : -1;

  if (!aFlexible) {
    const aTime = parseHHMM(a.startTime);
    const bTime = parseHHMM(b.startTime);
    if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime;
    if (aTime !== null && bTime === null) return -1;
    if (aTime === null && bTime !== null) return 1;
  }

  return a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id);
}

function orderHierarchyItemsForDay(sortedDayItems: ItineraryItem[]): ItineraryItem[] {
  const ids = new Set(sortedDayItems.map((item) => item.id));
  const childrenByParentId = new Map<string, ItineraryItem[]>();
  for (const item of sortedDayItems) {
    if (!item.parentItemId || !ids.has(item.parentItemId)) continue;
    childrenByParentId.set(item.parentItemId, [...(childrenByParentId.get(item.parentItemId) ?? []), item]);
  }

  const ordered: ItineraryItem[] = [];
  const emitted = new Set<string>();
  for (const item of sortedDayItems) {
    if (item.parentItemId && ids.has(item.parentItemId)) continue;
    ordered.push(item);
    emitted.add(item.id);
    for (const child of childrenByParentId.get(item.id) ?? []) {
      ordered.push(child);
      emitted.add(child.id);
    }
  }

  for (const item of sortedDayItems) {
    if (!emitted.has(item.id)) ordered.push(item);
  }

  return ordered;
}

function parseHHMM(value: string): number | null {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
