import type { Locale } from "@/src/i18n/types";
import type {
  ItineraryItem,
  Trip,
  ValidationWarning,
} from "./types";
import {
  compareItineraryItemsWithinDay,
  orderHierarchyItemsForDay,
  sortItineraryItemsByDayAndHierarchy,
} from "./itinerary-item-ordering";
import { itineraryItemPathFieldsForTarget } from "./itinerary-path-selection";
import {
  buildOverlapWarnings,
  getTimeWindowInterval,
  validateHierarchyFields,
  validateItemFields,
} from "./itinerary-validation";
export { parseTime } from "./itinerary-time";
import { parseTime } from "./itinerary-time";
export {
  type ItineraryPathOption,
  type ItineraryPathSelection,
  type ItineraryPathSelectionAction,
  deriveItineraryPathOptions,
  itineraryItemPathFieldsForTarget,
  itineraryPathOptionsForDay,
  resolveItineraryPathItems,
  selectedItineraryPathIdForDay,
  updateItineraryPathSelection,
} from "./itinerary-path-selection";

export { mainItineraryPathId, itineraryItemPathId, humanizePathId, mainItineraryPathName } from "./itinerary-path-identifiers";

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

export function buildItineraryView(items: ItineraryItem[]): ItineraryView {
  const sortedItems = sortItineraryItemsByDayAndHierarchy(items);

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

export function getNowNext(
  items: ItineraryItem[],
  day: string,
  currentTime: string,
): { current: ItineraryItem | null; next: ItineraryItem | null; fallbackReason: string | null } {
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

export function formatDayLabel(day: string, startDate: string, locale: Locale = "en"): string {
  const start = new Date(`${startDate}T00:00:00Z`);
  const current = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(current.getTime())) return day;
  const dayNumber = Math.round((current.getTime() - start.getTime()) / 86_400_000) + 1;
  return locale === "th" ? `วันที่ ${dayNumber}` : `Day ${dayNumber}`;
}
