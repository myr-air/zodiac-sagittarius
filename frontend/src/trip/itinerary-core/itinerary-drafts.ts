import type {
  ItineraryItem,
  Trip,
} from "../types";
import { itineraryItemPathFieldsForTarget } from "../itinerary-paths";

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

export function getNextSortOrder(items: ItineraryItem[], day: string): number {
  const dayOrders = items
    .filter((item) => item.day === day)
    .map((item) => item.sortOrder);
  /* v8 ignore next */
  return dayOrders.length ? Math.max(...dayOrders) + 100 : 100;
}

export function getNextChildSortOrder(
  items: ItineraryItem[],
  parentItem: ItineraryItem,
): number {
  const siblingOrders = items
    .filter(
      (item) =>
        item.day === parentItem.day && item.parentItemId === parentItem.id,
    )
    .map((item) => item.sortOrder);
  if (siblingOrders.length) return Math.max(...siblingOrders) + 10;
  return parentItem.sortOrder + 10;
}

export function normalizeStopHierarchyValues<
  T extends { parentItemId?: string | null; isPlanBlock?: boolean },
>(values: T): T {
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
