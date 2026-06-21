import type { ItineraryItem } from "../types";
import type { ItineraryItemResponse } from "./api-response-types";

export function mapItineraryItem(item: ItineraryItemResponse): ItineraryItem {
  return {
    ...item,
    itemKind: item.itemKind ?? "activity",
    timeMode: item.timeMode ?? "scheduled",
    isPlanBlock: item.isPlanBlock ?? false,
    status: item.status ?? "idea",
    priority: item.priority ?? "normal",
    endTime: item.endTime ?? null,
    endOffsetDays: item.endOffsetDays ?? 0,
    activitySubtype: item.activitySubtype ?? null,
    coordinates: item.coordinates ?? undefined,
    address: item.address ?? undefined,
    details: item.details ?? {},
  };
}
