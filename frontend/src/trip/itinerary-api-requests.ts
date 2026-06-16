import type { CreateItineraryItemApiRequest } from "./api-client";
import type { ItineraryItem } from "./types";

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
