import type { StopFormValues } from "@/src/features/itinerary/components";
import type { ItineraryItem } from "@/src/trip/types";

export function buildPromotedFoodRecommendationStop(item: ItineraryItem): StopFormValues | null {
  if (item.itemKind !== "foodRecommendation") return null;

  return {
    day: item.day,
    parentItemId: item.parentItemId ?? null,
    itemKind: "meal",
    timeMode: item.timeMode ?? "flexible",
    isPlanBlock: false,
    status: "planned",
    priority: item.priority ?? "normal",
    startTime: item.startTime,
    endTime: item.endTime ?? null,
    endOffsetDays: item.endOffsetDays ?? 0,
    activity: item.activity,
    activityType: "food",
    place: item.place,
    mapLink: item.mapLink,
    durationMinutes: item.durationMinutes,
    transportation: item.transportation,
    details: {
      ...(item.details ?? {}),
      promotedFromItemId: item.id,
      sourceItemKind: item.itemKind,
    },
    note: item.note,
    saveUnresolved: true,
  };
}
