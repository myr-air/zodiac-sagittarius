import type {
  CreateItineraryItemApiRequest,
} from "@/src/trip/api-client";
import type { ItineraryItem } from "@/src/trip/types";
import { resolveCreatedImportId } from "./itinerary-import-model";

interface BuildImportedItineraryItemCreateRequestInput {
  clientMutationId: string;
  createdItemIdsByImportId: Map<string, string>;
  createdItemIdsByPreviewId: Map<string, string>;
  item: ItineraryItem;
}

export function buildImportedItineraryItemCreateRequest({
  clientMutationId,
  createdItemIdsByImportId,
  createdItemIdsByPreviewId,
  item,
}: BuildImportedItineraryItemCreateRequestInput): CreateItineraryItemApiRequest {
  return {
    clientMutationId,
    planVariantId: item.planVariantId,
    pathGroupId: item.pathGroupId,
    pathId: item.pathId,
    pathName: item.pathName,
    pathRole: item.pathRole,
    parentItemId: resolveCreatedImportId(item.parentItemId, [
      createdItemIdsByImportId,
      createdItemIdsByPreviewId,
    ]),
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
    activitySubtype: item.activitySubtype ?? null,
    place: item.place,
    mapLink: item.mapLink,
    address: item.address,
    coordinates: item.coordinates,
    durationMinutes: item.durationMinutes,
    transportation: item.transportation,
    details: item.details,
    note: item.note,
  };
}
