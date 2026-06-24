import type {
  ItineraryItem,
  Trip,
} from "../types";
import {
  getNextChildSortOrder,
  getNextSortOrder,
} from "./itinerary-draft-ordering";
import {
  itineraryItemDraftPathFields,
} from "./itinerary-draft-path-fields";

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
  const pathFields = itineraryItemDraftPathFields({
    nextItemId: options.nextItemId,
    parentItem,
    pathId: options.pathId,
    pathName: options.pathName,
  });

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
