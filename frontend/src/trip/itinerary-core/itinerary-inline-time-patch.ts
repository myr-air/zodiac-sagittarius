import type { ItineraryItem } from "@/src/trip/types";
import {
  normalizeDurationMinutes,
  parseTime,
} from "./itinerary-time";

export type InlineItineraryTimePatch = Partial<
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

export function normalizeInlineTimePatch(
  item: ItineraryItem,
  patch: InlineItineraryTimePatch,
): InlineItineraryTimePatch {
  const nextPatch: InlineItineraryTimePatch = { ...patch };
  const hasStartTime = nextPatch.startTime !== undefined;
  const hasEndTime = nextPatch.endTime !== undefined;
  const hasEndOffsetDays = nextPatch.endOffsetDays !== undefined;
  if (!hasStartTime && !hasEndTime && !hasEndOffsetDays) return nextPatch;

  const startTime = hasStartTime ? nextPatch.startTime : item.startTime;
  const endTime = hasEndTime ? nextPatch.endTime : item.endTime;
  if (!endTime) {
    if (hasEndTime) {
      nextPatch.endOffsetDays = 0;
      nextPatch.durationMinutes = null;
    }
    return nextPatch;
  }

  const start = parseTime(startTime ?? "");
  const end = parseTime(endTime);
  if (start === null || end === null) return nextPatch;

  const minimumEndOffsetDays = end <= start ? 1 : 0;
  const endOffsetDays = hasEndOffsetDays
    ? Math.max(nextPatch.endOffsetDays ?? 0, minimumEndOffsetDays)
    : minimumEndOffsetDays;
  if (endOffsetDays !== (nextPatch.endOffsetDays ?? item.endOffsetDays ?? 0)) {
    nextPatch.endOffsetDays = endOffsetDays;
  }
  const durationMinutes = end + endOffsetDays * 24 * 60 - start;
  if (durationMinutes > 0) {
    nextPatch.durationMinutes = durationMinutes;
  }
  return nextPatch;
}

export function buildInlineItineraryItemPatch(
  item: ItineraryItem,
  patch: InlineItineraryTimePatch,
): InlineItineraryTimePatch | null {
  const nextPatch = normalizeInlineTimePatch(item, patch);
  if (nextPatch.activity !== undefined)
    nextPatch.activity = nextPatch.activity.trim();
  if (nextPatch.place !== undefined)
    nextPatch.place = nextPatch.place.trim();
  if (nextPatch.transportation !== undefined)
    nextPatch.transportation = nextPatch.transportation.trim();
  if (
    nextPatch.durationMinutes !== undefined &&
    nextPatch.durationMinutes !== null
  )
    nextPatch.durationMinutes = normalizeDurationMinutes(nextPatch.durationMinutes);
  if (nextPatch.activity !== undefined && nextPatch.activity.length === 0)
    return null;
  if (nextPatch.place !== undefined && nextPatch.place.length === 0)
    return null;
  const changedPatch = Object.fromEntries(
    Object.entries(nextPatch).filter(
      ([key, value]) => item[key as keyof InlineItineraryTimePatch] !== value,
    ),
  ) as InlineItineraryTimePatch;
  return Object.keys(changedPatch).length > 0 ? changedPatch : null;
}
