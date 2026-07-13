import type { ItineraryItem } from "../types";

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
    | "note"
  >
>;
