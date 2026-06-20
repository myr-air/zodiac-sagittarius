import type { ItineraryItem } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import { activityTypeLabel } from "@/src/features/itinerary/lib";
import { type IconName } from "@/src/ui/icons";
import type { InlineItineraryItemPatch } from "../lib";
import { withoutTravelSubtypeDetails } from "./itinerary-travel-subtypes";

export {
  normalizeTravelSubtype,
  travelSubtypeForItem,
  travelSubtypeIcons,
  travelSubtypeOptions,
  travelSubtypes,
  withoutTravelSubtypeDetails,
} from "./itinerary-travel-subtypes";
export type { TravelSubtype } from "./itinerary-travel-subtypes";

const activityTypeIcons: Record<ItineraryItem["activityType"], IconName> = {
  attraction: "location",
  default: "document",
  experience: "ticket",
  food: "utensils",
  shopping: "wallet",
  stay: "home",
  travel: "route",
};

export function buildActivityTypePatch(
  item: ItineraryItem,
  activityType: string,
): InlineItineraryItemPatch {
  const nextActivityType = activityType as ItineraryItem["activityType"];
  if (nextActivityType === "travel") {
    return { activityType: nextActivityType };
  }

  const detailsWithoutTravelMode = withoutTravelSubtypeDetails(item.details);
  return {
    activityType: nextActivityType,
    activitySubtype: null,
    details: detailsWithoutTravelMode,
  };
}

export function buildActivitySubtypePatch(
  item: ItineraryItem,
  activityType: ItineraryItem["activityType"],
  subtype: string,
): InlineItineraryItemPatch {
  if (activityType !== "travel") return buildActivityTypePatch(item, activityType);
  return {
    activityType,
    activitySubtype: subtype as ItineraryItem["activitySubtype"],
    details: {
      ...(item.details ?? {}),
      subtype,
    },
  };
}

export function activityTypeOptions(locale: Locale): Array<{ icon: IconName; value: string; label: string }> {
  const types: ItineraryItem["activityType"][] = [
    "travel",
    "food",
    "shopping",
    "attraction",
    "experience",
    "stay",
    "default",
  ];
  return types.map((type) => ({
    icon: activityTypeIcons[type],
    value: type,
    label: activityTypeLabel(type, locale),
  }));
}
