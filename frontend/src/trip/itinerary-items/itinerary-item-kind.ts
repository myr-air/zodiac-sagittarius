import type { ItineraryItem } from "../types";

export function itemKindFromActivityType(
  activityType: ItineraryItem["activityType"],
): ItineraryItem["itemKind"] {
  if (activityType === "travel") return "travel";
  if (activityType === "food") return "meal";
  if (activityType === "stay") return "lodging";
  return "activity";
}
