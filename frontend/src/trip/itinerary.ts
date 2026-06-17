import type { Locale } from "@/src/i18n/types";
import type {
  ItineraryItem,
  ItineraryPath,
  ItineraryPathScope,
  Trip,
  ValidationWarning,
} from "./types";
import { itineraryItemPathId, humanizePathId, mainItineraryPathId, mainItineraryPathName } from "./itinerary-path-identifiers";
export { mainItineraryPathId, itineraryItemPathId, humanizePathId, mainItineraryPathName } from "./itinerary-path-identifiers";

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

export interface ItineraryDayGroup {
  day: string;
  items: ItineraryItem[];
  warningCount: number;
}

export interface ItineraryRouteDayStat {
  day: string;
  itemCount: number;
  coordinateItemCount: number;
  warningCount: number;
}

export interface ItineraryView {
  dayGroups: ItineraryDayGroup[];
  sortedItems: ItineraryItem[];
  warningCount: number;
  routeDayStats: ItineraryRouteDayStat[];
}

export interface ItineraryCommitmentSummary {
  bookingCount?: number;
  expenseCount?: number;
  noteCount?: number;
  openTaskCount?: number;
}

interface BuildItineraryCommitmentsInput {
  bookingDocs: Array<{ relatedItineraryItemIds: string[] }>;
  expenses: Array<{ itineraryItemId?: string | null }>;
  stopNotes: Array<{ itemId: string }>;
  tasks: Array<{ relatedItemId?: string | null; status: string }>;
}

export type BuildItineraryItemDraftInput = Pick<
    ItineraryItem,
    | "activity"
    | "activityType"
    | "day"
    | "details"
    | "durationMinutes"
    | "endOffsetDays"
    | "endTime"
    | "isPlanBlock"
    | "itemKind"
    | "note"
    | "parentItemId"
    | "place"
    | "priority"
    | "startTime"
    | "status"
    | "timeMode"
    | "transportation"
  >;

export interface BuildItineraryItemDraftOptions {
  address: string;
  coordinates: ItineraryItem["coordinates"];
  createdBy: string;
  mapLink: string;
  nextItemId: string;
  pathName?: string;
  pathId: string;
  planItems: ItineraryItem[];
  selectedTripPlanId: string;
  trip: Pick<Trip, "id" | "itineraryItems">;
  updatedAt: string;
}

export interface BuildUpdatedItineraryItemOptions {
  address: ItineraryItem["address"];
  coordinates: ItineraryItem["coordinates"];
  mapLink: string;
  updatedAt: string;
}

export interface ItineraryItemPlacement {
  trip: Trip;
  item: ItineraryItem;
  changedExistingItems: ItineraryItem[];
}

export function getTripDates(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [startDate];

  const dates: string[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}

export function sortItemsForDay(items: ItineraryItem[], day: string): ItineraryItem[] {
  return orderHierarchyItemsForDay(items
    .filter((item) => item.day === day)
    .slice()
    .sort(compareItineraryItemsWithinDay));
}

export function getNextSortOrder(items: ItineraryItem[], day: string): number {
  const dayOrders = items
    .filter((item) => item.day === day)
    .map((item) => item.sortOrder);
  /* v8 ignore next */
  return dayOrders.length ? Math.max(...dayOrders) + 100 : 100;
}

export function getNextChildSortOrder(items: ItineraryItem[], parentItem: ItineraryItem): number {
  const siblingOrders = items
    .filter((item) => item.day === parentItem.day && item.parentItemId === parentItem.id)
    .map((item) => item.sortOrder);
  if (siblingOrders.length) return Math.max(...siblingOrders) + 10;
  return parentItem.sortOrder + 10;
}

export function normalizeStopHierarchyValues<T extends { parentItemId?: string | null; isPlanBlock?: boolean }>(
  values: T,
): T {
  return values.parentItemId ? { ...values, isPlanBlock: false } : values;
}

export function buildItineraryItemDraft(
  input: BuildItineraryItemDraftInput,
  options: BuildItineraryItemDraftOptions,
): ItineraryItem {
  const parentItem = input.parentItemId
    ? options.trip.itineraryItems.find((item) => item.id === input.parentItemId)
    : undefined;
  const sortOrder = parentItem
    ? getNextChildSortOrder(options.planItems, parentItem)
    : getNextSortOrder(options.planItems, input.day);
  const pathFields = parentItem
    ? {
        pathGroupId: parentItem.pathGroupId,
        pathId: parentItem.pathId,
        pathName: parentItem.pathName,
        pathRole: parentItem.pathRole ?? "main",
      }
    : itineraryItemPathFieldsForTarget(
        `path-group-${options.nextItemId}`,
        options.pathId,
        options.pathName,
      );

  return {
    id: options.nextItemId,
    tripId: options.trip.id,
    planVariantId: parentItem?.planVariantId ?? options.selectedTripPlanId,
    ...pathFields,
    parentItemId: input.parentItemId ?? null,
    itemKind: input.itemKind,
    timeMode: input.timeMode,
    isPlanBlock: input.isPlanBlock,
    status: input.status,
    priority: input.priority,
    day: input.day,
    sortOrder,
    startTime: input.startTime,
    endTime: input.endTime,
    endOffsetDays: input.endOffsetDays,
    activity: input.activity,
    activityType: input.activityType,
    place: input.place,
    linkLabel: "แผนที่",
    mapLink: options.mapLink,
    address: options.address,
    coordinates: options.coordinates,
    durationMinutes: input.durationMinutes,
    transportation: input.transportation,
    details: input.details,
    advisories: [],
    note: input.note,
    createdBy: options.createdBy,
    updatedAt: options.updatedAt,
    version: 1,
  };
}

export function appendItineraryItemToTrip(
  trip: Trip,
  item: ItineraryItem,
): Trip {
  return {
    ...trip,
    itineraryItems: [...trip.itineraryItems, item],
  };
}

export function buildUpdatedItineraryItem(
  item: ItineraryItem,
  input: BuildItineraryItemDraftInput,
  options: BuildUpdatedItineraryItemOptions,
): ItineraryItem {
  return {
    ...item,
    day: input.day,
    parentItemId: input.parentItemId ?? null,
    itemKind: input.itemKind,
    timeMode: input.timeMode,
    isPlanBlock: input.isPlanBlock,
    status: input.status,
    priority: input.priority,
    startTime: input.startTime,
    endTime: input.endTime,
    endOffsetDays: input.endOffsetDays,
    activity: input.activity,
    activityType: input.activityType,
    place: input.place,
    mapLink: options.mapLink,
    address: options.address,
    coordinates: options.coordinates,
    durationMinutes: input.durationMinutes,
    transportation: input.transportation,
    details: input.details,
    note: input.note,
    updatedAt: options.updatedAt,
    version: item.version + 1,
  };
}

export function appendItineraryItemPlacement(
  trip: Trip,
  item: ItineraryItem,
): ItineraryItemPlacement {
  return {
    trip: appendItineraryItemToTrip(trip, item),
    item,
    changedExistingItems: [],
  };
}

export function mergeCreatedItineraryItemIntoTrip(
  trip: Trip,
  createdItem: ItineraryItem,
  placement: Pick<ItineraryItemPlacement, "item">,
  patchedBranchItems: ItineraryItem[],
): Trip {
  const createdItemWithPath = {
    ...createdItem,
    pathGroupId: placement.item.pathGroupId,
    pathId: placement.item.pathId,
    pathName: placement.item.pathName,
    pathRole: placement.item.pathRole,
  };
  const patchedBranchItemsById = new Map(
    patchedBranchItems.map((item) => [item.id, item]),
  );

  return {
    ...trip,
    itineraryItems: [
      ...trip.itineraryItems.map(
        (item) => patchedBranchItemsById.get(item.id) ?? item,
      ),
      createdItemWithPath,
    ],
  };
}

export function mergeUpdatedItineraryBranchIntoTrip(
  trip: Trip,
  itemId: string,
  placement: ItineraryItemPlacement,
  patchedBranchItems: ItineraryItem[],
): Trip {
  const patchedBranchItemsById = new Map(
    patchedBranchItems.map((item) => [item.id, item]),
  );
  const changedItemIds = new Set(
    placement.changedExistingItems.map((item) => item.id),
  );
  const branchPlacementItemsById = new Map(
    placement.trip.itineraryItems
      .filter((item) => changedItemIds.has(item.id))
      .map((item) => [item.id, item]),
  );

  return {
    ...trip,
    itineraryItems: trip.itineraryItems.map((item) => {
      if (patchedBranchItemsById.has(item.id))
        return patchedBranchItemsById.get(item.id) ?? item;
      if (branchPlacementItemsById.has(item.id))
        return branchPlacementItemsById.get(item.id) ?? item;
      return item.id === itemId ? placement.item : item;
    }),
  };
}

export function replaceItineraryItem(current: Trip, updatedItem: ItineraryItem): Trip {
  return replaceItineraryItems(current, [updatedItem]);
}

export function replaceItineraryItems(
  current: Trip,
  updatedItems: ItineraryItem[],
): Trip {
  const updatedItemsById = new Map(updatedItems.map((item) => [item.id, item]));
  return {
    ...current,
    itineraryItems: current.itineraryItems.map((item) =>
      updatedItemsById.get(item.id) ?? item,
    ),
  };
}

export function deleteItineraryItemFromTrip(current: Trip, itemId: string): Trip {
  return {
    ...current,
    itineraryItems: current.itineraryItems.filter((item) => item.id !== itemId),
    expenses: current.expenses.filter(
      (expense) => expense.itineraryItemId !== itemId,
    ),
  };
}

export function moveTripItem(
  current: Trip,
  draggedItemId: string,
  targetItemId: string,
  planVariantId: string,
  updatedAt: string,
): Trip | null {
  const draggedItem = current.itineraryItems.find(
    (item) => item.id === draggedItemId,
  );
  const targetItem = current.itineraryItems.find(
    (item) => item.id === targetItemId,
  );

  if (
    !draggedItem ||
    !targetItem ||
    draggedItem.planVariantId !== planVariantId ||
    targetItem.planVariantId !== planVariantId
  )
    return null;
  const nextParentItemId = targetItem.parentItemId ?? null;
  if (
    nextParentItemId === draggedItem.id ||
    (draggedItem.isPlanBlock && nextParentItemId) ||
    hasDescendantItem(current.itineraryItems, draggedItem.id, targetItem.id)
  )
    return null;

  const targetDayItems = current.itineraryItems
    .filter(
      (item) =>
        item.planVariantId === targetItem.planVariantId &&
        item.day === targetItem.day &&
        item.id !== draggedItemId,
    )
    .sort(compareItineraryItemsWithinDay);
  const targetIndex = targetDayItems.findIndex(
    (item) => item.id === targetItemId,
  );

  if (targetIndex < 0) return null;

  const nextDayItems = [
    ...targetDayItems.slice(0, targetIndex),
    {
      ...draggedItem,
      day: targetItem.day,
      parentItemId: nextParentItemId,
      updatedAt,
      version: draggedItem.version + 1,
    },
    ...targetDayItems.slice(targetIndex),
  ].map((item, index) => ({ ...item, sortOrder: (index + 1) * 100 }));
  const nextItemsById = new Map(nextDayItems.map((item) => [item.id, item]));

  return {
    ...current,
    itineraryItems: current.itineraryItems.map(
      (item) => nextItemsById.get(item.id) ?? item,
    ),
  };
}

export function moveTripItemToDay(
  current: Trip,
  draggedItemId: string,
  targetDay: string,
  planVariantId: string,
  updatedAt: string,
): Trip | null {
  const draggedItem = current.itineraryItems.find(
    (item) => item.id === draggedItemId,
  );
  if (!draggedItem || draggedItem.planVariantId !== planVariantId)
    return null;

  const targetDayItems = current.itineraryItems
    .filter(
      (item) =>
        item.planVariantId === draggedItem.planVariantId &&
        item.day === targetDay &&
        item.id !== draggedItemId,
    )
    .sort(compareItineraryItemsWithinDay);
  const nextDayItems = [
    ...targetDayItems,
    {
      ...draggedItem,
      day: targetDay,
      parentItemId: null,
      updatedAt,
      version: draggedItem.version + 1,
    },
  ].map((item, index) => ({ ...item, sortOrder: (index + 1) * 100 }));
  const nextItemsById = new Map(nextDayItems.map((item) => [item.id, item]));

  return {
    ...current,
    itineraryItems: current.itineraryItems.map(
      (item) => nextItemsById.get(item.id) ?? item,
    ),
  };
}

export function moveTripItemIntoPlanBlock(
  current: Trip,
  draggedItemId: string,
  planBlockItemId: string,
  planVariantId: string,
  updatedAt: string,
): Trip | null {
  const draggedItem = current.itineraryItems.find(
    (item) => item.id === draggedItemId,
  );
  const planBlock = current.itineraryItems.find(
    (item) => item.id === planBlockItemId,
  );
  if (
    !draggedItem ||
    !planBlock ||
    !planBlock.isPlanBlock ||
    draggedItem.isPlanBlock ||
    draggedItem.id === planBlock.id ||
    draggedItem.planVariantId !== planVariantId ||
    planBlock.planVariantId !== planVariantId ||
    hasDescendantItem(current.itineraryItems, draggedItem.id, planBlock.id)
  )
    return null;

  const targetDayItems = current.itineraryItems
    .filter(
      (item) =>
        item.planVariantId === planBlock.planVariantId &&
        item.day === planBlock.day &&
        item.id !== draggedItemId,
    )
    .sort(compareItineraryItemsWithinDay);
  const blockIndex = targetDayItems.findIndex(
    (item) => item.id === planBlockItemId,
  );
  if (blockIndex < 0) return null;
  const childCount = targetDayItems.filter(
    (item) => item.parentItemId === planBlockItemId,
  ).length;
  const insertIndex = blockIndex + childCount + 1;
  const nextDayItems = [
    ...targetDayItems.slice(0, insertIndex),
    {
      ...draggedItem,
      day: planBlock.day,
      parentItemId: planBlock.id,
      updatedAt,
      version: draggedItem.version + 1,
    },
    ...targetDayItems.slice(insertIndex),
  ].map((item, index) => ({ ...item, sortOrder: (index + 1) * 100 }));
  const nextItemsById = new Map(nextDayItems.map((item) => [item.id, item]));

  return {
    ...current,
    itineraryItems: current.itineraryItems.map(
      (item) => nextItemsById.get(item.id) ?? item,
    ),
  };
}

export function hasDescendantItem(
  items: ItineraryItem[],
  parentItemId: string,
  candidateItemId: string,
): boolean {
  let currentItem = items.find((item) => item.id === candidateItemId);
  while (currentItem?.parentItemId) {
    if (currentItem.parentItemId === parentItemId) return true;
    currentItem = items.find((item) => item.id === currentItem?.parentItemId);
  }
  return false;
}

export function resolveItineraryPathItems(items: ItineraryItem[], selection: ItineraryPathSelection = {}): ItineraryItem[] {
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
    const selectedPathId = selection.dayPathOverrides?.[day] || selection.tripPathId || mainItineraryPathId;
    const selected = groupItems.find((item) => itineraryItemPathId(item) === selectedPathId);
    const main = groupItems.find((item) => itineraryItemPathId(item) === mainItineraryPathId);
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
): Pick<ItineraryItem, "pathGroupId" | "pathId" | "pathName" | "pathRole"> {
  if (pathId === mainItineraryPathId) {
    return { pathGroupId, pathRole: "main" };
  }
  return { pathGroupId, pathId, pathName, pathRole: "alternative" };
}

export function deriveItineraryPathOptions(items: ItineraryItem[], paths: ItineraryPath[] = []): ItineraryPathOption[] {
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
    if (item.pathRole !== "alternative" || !item.pathId || options.has(item.pathId)) continue;
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
  return pathOptions.filter((option) =>
    option.id === mainItineraryPathId ||
    option.scope === "trip" ||
    option.day === day
  );
}

export function buildItineraryView(items: ItineraryItem[]): ItineraryView {
  const sortedItems = sortItineraryItems(items);

  const dayBuckets = new Map<string, ItineraryItem[]>();
  for (const item of sortedItems) {
    const bucket = dayBuckets.get(item.day);
    if (!bucket) {
      dayBuckets.set(item.day, [item]);
    } else {
      bucket.push(item);
    }
  }

  const dayGroups: ItineraryDayGroup[] = [];
  const routeDayStats: ItineraryRouteDayStat[] = [];

  let warningCount = 0;

  for (const day of Array.from(dayBuckets.keys()).sort()) {
    const dayItems = dayBuckets.get(day) ?? [];
    const baseWarningsByItem = new Map<string, ValidationWarning[]>();

    for (const item of dayItems) {
      baseWarningsByItem.set(item.id, [
        ...validateItemFields(item),
        ...validateHierarchyFields(item, dayItems),
      ]);
    }

    const overlapWarningsByItem = buildOverlapWarnings(dayItems);
    for (const [itemId, overlapWarnings] of overlapWarningsByItem) {
      baseWarningsByItem.set(itemId, [...(baseWarningsByItem.get(itemId) ?? []), ...overlapWarnings]);
    }

    const dayWarningCount = dayItems.reduce(
      (total, item) => total + (baseWarningsByItem.get(item.id)?.length ?? 0),
      0,
    );

    warningCount += dayWarningCount;
    dayGroups.push({ day, items: dayItems, warningCount: dayWarningCount });
    routeDayStats.push({
      day,
      itemCount: dayItems.length,
      coordinateItemCount: dayItems.filter((item) => item.coordinates).length,
      warningCount: dayWarningCount,
    });
  }

  return { dayGroups, sortedItems, warningCount, routeDayStats };
}

export function buildItineraryCommitmentsByItemId({
  bookingDocs,
  expenses,
  stopNotes,
  tasks,
}: BuildItineraryCommitmentsInput): Record<string, ItineraryCommitmentSummary> {
  const commitments = new Map<string, ItineraryCommitmentSummary>();
  const ensure = (itemId: string) => {
    const current = commitments.get(itemId) ?? {};
    commitments.set(itemId, current);
    return current;
  };

  for (const booking of bookingDocs) {
    for (const itemId of booking.relatedItineraryItemIds) {
      const current = ensure(itemId);
      current.bookingCount = (current.bookingCount ?? 0) + 1;
    }
  }
  for (const expense of expenses) {
    if (!expense.itineraryItemId) continue;
    const current = ensure(expense.itineraryItemId);
    current.expenseCount = (current.expenseCount ?? 0) + 1;
  }
  for (const task of tasks) {
    if (!task.relatedItemId || task.status === "done") continue;
    const current = ensure(task.relatedItemId);
    current.openTaskCount = (current.openTaskCount ?? 0) + 1;
  }
  for (const note of stopNotes) {
    const current = ensure(note.itemId);
    current.noteCount = (current.noteCount ?? 0) + 1;
  }

  return Object.fromEntries(commitments);
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

export function groupItemsByDay(items: ItineraryItem[]): ItineraryDayGroup[] {
  return buildItineraryView(items).dayGroups;
}

export function validateItineraryItem(item: ItineraryItem, dayItems: ItineraryItem[]): ValidationWarning[] {
  const warnings = [
    ...validateItemFields(item),
    ...validateHierarchyFields(item, dayItems),
  ];
  const overlapWarnings = buildOverlapWarnings(dayItems);
  const itemOverlapWarnings = overlapWarnings.get(item.id);
  if (itemOverlapWarnings) warnings.push(...itemOverlapWarnings);
  return warnings;
}

function buildOverlapWarnings(dayItems: ItineraryItem[]): Map<string, ValidationWarning[]> {
  const warningsByItemId = new Map<string, ValidationWarning[]>();
  const intervalsBySiblingScope = new Map<string, Array<{ item: ItineraryItem; start: number; end: number }>>();
  for (const item of dayItems) {
    const interval = getTimeWindowInterval(item);
    if (!interval) continue;
    const siblingScope = item.parentItemId ? `parent:${item.parentItemId}` : "top-level";
    intervalsBySiblingScope.set(siblingScope, [
      ...(intervalsBySiblingScope.get(siblingScope) ?? []),
      interval,
    ]);
  }

  for (const validIntervals of intervalsBySiblingScope.values()) {
    validIntervals.sort((a, b) => a.start - b.start || a.end - b.end || a.item.sortOrder - b.item.sortOrder);
    if (validIntervals.length < 2) continue;

    let group: Array<{ item: ItineraryItem; end: number }> = [];
    let groupMaxEnd = 0;

    const addOverlapWarningGroup = (groupItems: Array<{ item: ItineraryItem; end: number }>) => {
      if (groupItems.length < 2) return;
      const primary = groupItems[0]?.item;
      const secondary = groupItems[1]?.item;
      if (!primary || !secondary) return;
      for (const entry of groupItems) {
        const overlapTarget = entry.item.id === primary.id ? secondary : primary;
        warningsByItemId.set(entry.item.id, [{
          code: "overlap",
          message: `This stop overlaps ${overlapTarget.activity}; ตรวจเวลาอีกครั้งก่อน publish.`,
          itemId: entry.item.id,
        }]);
      }
    };

    for (const entry of validIntervals) {
      if (!group.length) {
        group = [entry];
        groupMaxEnd = entry.end;
        continue;
      }

      if (entry.start < groupMaxEnd) {
        group.push(entry);
        groupMaxEnd = Math.max(groupMaxEnd, entry.end);
        continue;
      }

      addOverlapWarningGroup(group);
      group = [entry];
      groupMaxEnd = entry.end;
    }

    addOverlapWarningGroup(group);
  }
  return warningsByItemId;
}

function validateItemFields(item: ItineraryItem): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const start = parseTime(item.startTime);
  const isFlexible = item.timeMode === "flexible";

  if (!isFlexible && !item.startTime.trim()) {
    warnings.push({ code: "missing-start-time", message: "Add a start time before this stop can appear in Now / Next.", itemId: item.id });
  } else if (!isFlexible && start === null) {
    warnings.push({ code: "invalid-start-time", message: "Use 24-hour time, for example 13:30.", itemId: item.id });
  }

  if (!isFlexible && !item.endTime && (item.durationMinutes === null || item.durationMinutes <= 0)) {
    warnings.push({ code: "missing-duration", message: "Add an end time or duration so route timing can be checked.", itemId: item.id });
  }

  if (!item.mapLink.trim()) {
    warnings.push({ code: "missing-map-link", message: "Add a map link or place fallback for this stop.", itemId: item.id });
  }

  if (!item.transportation.trim()) {
    warnings.push({ code: "missing-transportation", message: "Add transport notes so the group knows the next move.", itemId: item.id });
  }

  return warnings;
}

function validateHierarchyFields(item: ItineraryItem, dayItems: ItineraryItem[]): ValidationWarning[] {
  if (!item.parentItemId) return [];
  const parent = dayItems.find((candidate) => candidate.id === item.parentItemId);
  if (!parent) {
    return [{
      code: "missing-parent-item",
      message: "This sub-activity is linked to a parent that is not in this day plan.",
      itemId: item.id,
    }];
  }

  const warnings: ValidationWarning[] = [];
  if (parent.parentItemId) {
    warnings.push({
      code: "nested-sub-activity",
      message: "Sub-activities can only sit under an activity block, not under another sub-activity.",
      itemId: item.id,
    });
  }

  if (!parent.isPlanBlock) {
    warnings.push({
      code: "invalid-parent-plan-block",
      message: "Move this sub-activity under an activity block or promote its parent to a block.",
      itemId: item.id,
    });
  }

  if (item.day !== parent.day || item.planVariantId !== parent.planVariantId) {
    warnings.push({
      code: "parent-scope-mismatch",
      message: "Sub-activities must stay in the same day and Trip Plan as their parent block.",
      itemId: item.id,
    });
  }

  if (warnings.length > 0 || item.timeMode === "flexible" || parent.timeMode === "flexible") {
    return warnings;
  }

  const parentInterval = getTimeWindowInterval(parent);
  const childInterval = getTimeWindowInterval(item);
  if (!parentInterval || !childInterval) return warnings;

  if (childInterval.start < parentInterval.start || childInterval.end > parentInterval.end) {
    warnings.push({
      code: "child-outside-plan-block",
      message: `This child item sits outside ${parent.activity}; adjust the time or move it out of the block.`,
      itemId: item.id,
    });
  }
  return warnings;
}

export function getNowNext(items: ItineraryItem[], day: string, currentTime: string): { current: ItineraryItem | null; next: ItineraryItem | null; fallbackReason: string | null } {
  const nowMinutes = parseTime(currentTime);
  if (nowMinutes === null) return { current: null, next: null, fallbackReason: "Current time is unavailable." };

  const timedItems = sortItemsForDay(items, day)
    .map((item) => getTimeWindowInterval(item))
    .filter((entry): entry is { item: ItineraryItem; start: number; end: number } => entry !== null)
    .sort((a, b) => a.start - b.start);

  if (timedItems.length === 0) return { current: null, next: null, fallbackReason: "No timed stops for this day yet." };

  const current = timedItems.find((entry) => nowMinutes >= entry.start && nowMinutes < entry.end);
  const next = timedItems.find((entry) => entry.start > nowMinutes);

  return {
    current: current?.item ?? null,
    next: next?.item ?? null,
    fallbackReason: current || next ? null : "The day plan has ended.",
  };
}

export function getTimeWindowInterval(
  item: ItineraryItem,
): { item: ItineraryItem; start: number; end: number } | null {
  if (item.timeMode === "flexible") return null;
  const start = parseTime(item.startTime);
  if (start === null) return null;

  const endTime = item.endTime?.trim();
  if (endTime) {
    const end = parseTime(endTime);
    if (end === null) return null;
    const endOffsetDays = item.endOffsetDays ?? 0;
    const endWithOffset = end + endOffsetDays * 24 * 60;
    if (endWithOffset <= start) return null;
    return { item, start, end: endWithOffset };
  }

  if (
    item.durationMinutes === null ||
    item.durationMinutes === undefined ||
    item.durationMinutes <= 0
  ) {
    return null;
  }
  return { item, start, end: start + item.durationMinutes };
}

function compareItineraryItemsWithinDay(a: ItineraryItem, b: ItineraryItem): number {
  const aFlexible = a.timeMode === "flexible";
  const bFlexible = b.timeMode === "flexible";
  if (aFlexible !== bFlexible) return aFlexible ? 1 : -1;

  if (!aFlexible) {
    const aTime = parseTime(a.startTime);
    const bTime = parseTime(b.startTime);
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
    childrenByParentId.set(item.parentItemId, [
      ...(childrenByParentId.get(item.parentItemId) ?? []),
      item,
    ]);
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

export function parseTime(value: string): number | null {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatDayLabel(day: string, startDate: string, locale: Locale = "en"): string {
  const start = new Date(`${startDate}T00:00:00Z`);
  const current = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(current.getTime())) return day;
  const dayNumber = Math.round((current.getTime() - start.getTime()) / 86_400_000) + 1;
  return locale === "th" ? `วันที่ ${dayNumber}` : `Day ${dayNumber}`;
}
