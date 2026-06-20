import type {
  PatchItineraryItemApiRequest,
  ReorderItineraryItemsApiRequest,
} from "./api-client";
import type { ItineraryItem } from "./types";

export interface BuildMoveItineraryItemRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
}

export interface BuildMoveItineraryItemToDayRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
  targetDay: string;
}

export interface BuildShiftItineraryItemDayRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
  shiftedDay: string;
}

export interface BuildReorderItineraryItemsRequestOptions {
  clientMutationId: string;
  day: string;
  planVariantId: string;
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

export function buildShiftItineraryItemDayRequest(
  options: BuildShiftItineraryItemDayRequestOptions,
): PatchItineraryItemApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: options.expectedVersion,
    patch: { day: options.shiftedDay },
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
