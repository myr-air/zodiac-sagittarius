import type { ItineraryItem } from "@/src/trip/types";

export type InlineItineraryItemPatch = Partial<
  Pick<
    ItineraryItem,
    | "parentItemId"
    | "startTime"
    | "endTime"
    | "endOffsetDays"
    | "durationMinutes"
    | "activity"
    | "place"
    | "address"
    | "coordinates"
    | "mapLink"
    | "details"
    | "activityType"
    | "activitySubtype"
    | "isPlanBlock"
    | "itemKind"
    | "timeMode"
    | "status"
    | "priority"
    | "transportation"
  >
>;
