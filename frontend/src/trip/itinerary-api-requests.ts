import type {
  CreateItineraryItemApiRequest,
  PatchItineraryItemApiRequest,
  ReorderItineraryItemsApiRequest,
} from "./api-client";
import type { BuildItineraryItemDraftInput } from "./itinerary";
import type { InlineItineraryTimePatch } from "./itinerary-time";
import { buildMapLink } from "./place-resolution";
import type { ItineraryItem } from "./types";

export interface BuildPatchItineraryItemRequestOptions {
  address: ItineraryItem["address"];
  clientMutationId: string;
  coordinates: ItineraryItem["coordinates"];
  expectedVersion: number;
  mapLink: string;
}

export interface BuildMoveItineraryItemRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
}

export interface BuildMoveItineraryItemToDayRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
  targetDay: string;
}

export interface BuildReorderItineraryItemsRequestOptions {
  clientMutationId: string;
  day: string;
  planVariantId: string;
}

export interface BuildInlineItineraryItemPatchRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
}

export function buildCreateItineraryItemRequest(
  item: ItineraryItem,
  clientMutationId: string,
): CreateItineraryItemApiRequest {
  return {
    clientMutationId,
    planVariantId: item.planVariantId,
    pathGroupId: item.pathGroupId,
    pathId: item.pathId,
    pathName: item.pathName,
    pathRole: item.pathRole,
    parentItemId: item.parentItemId ?? null,
    itemKind: item.itemKind,
    timeMode: item.timeMode,
    isPlanBlock: item.isPlanBlock,
    status: item.status,
    priority: item.priority,
    day: item.day,
    startTime: item.startTime,
    endTime: item.endTime,
    endOffsetDays: item.endOffsetDays,
    activity: item.activity,
    activityType: item.activityType,
    activitySubtype: item.activitySubtype,
    place: item.place,
    mapLink: item.mapLink,
    address: item.address ?? null,
    coordinates: item.coordinates ?? null,
    durationMinutes: item.durationMinutes,
    transportation: item.transportation,
    details: item.details,
    note: item.note,
  };
}

export function buildPatchItineraryItemRequest(
  input: BuildItineraryItemDraftInput,
  options: BuildPatchItineraryItemRequestOptions,
): PatchItineraryItemApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: options.expectedVersion,
    patch: {
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
      address: options.address ?? null,
      coordinates: options.coordinates ?? null,
      durationMinutes: input.durationMinutes,
      transportation: input.transportation,
      details: input.details,
      note: input.note,
    },
  };
}

export function buildMoveItineraryItemRequest(
  movedItem: Pick<ItineraryItem, "day" | "parentItemId" | "sortOrder">,
  options: BuildMoveItineraryItemRequestOptions,
): PatchItineraryItemApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: options.expectedVersion,
    patch: {
      day: movedItem.day,
      parentItemId: movedItem.parentItemId ?? null,
      sortOrder: movedItem.sortOrder,
    },
  };
}

export function buildMoveItineraryItemToDayRequest(
  options: BuildMoveItineraryItemToDayRequestOptions,
): PatchItineraryItemApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: options.expectedVersion,
    patch: {
      day: options.targetDay,
      parentItemId: null,
    },
  };
}

export function buildReorderItineraryItemsRequest(
  dayItems: Pick<ItineraryItem, "id" | "sortOrder" | "startTime">[],
  options: BuildReorderItineraryItemsRequestOptions,
): ReorderItineraryItemsApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    planVariantId: options.planVariantId,
    day: options.day,
    itemIds: dayItems
      .slice()
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime),
      )
      .map((item) => item.id),
  };
}

export function buildInlineItineraryItemPatchRequest(
  patch: InlineItineraryTimePatch,
  options: BuildInlineItineraryItemPatchRequestOptions,
): PatchItineraryItemApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: options.expectedVersion,
    patch: {
      ...patch,
      ...(patch.place !== undefined
        ? {
            address: patch.place,
            coordinates: null,
            mapLink: buildMapLink(patch.place),
          }
        : {}),
    },
  };
}
