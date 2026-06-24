import type { ItineraryItem } from "../types";
import { parseTime } from "./itinerary-time";

export type TimeWindowInterval = {
  item: ItineraryItem;
  start: number;
  end: number;
};

export function getTimeWindowInterval(item: ItineraryItem): TimeWindowInterval | null {
  if (item.timeMode === "flexible") return null;
  const start = parseTime(item.startTime);
  if (start === null) return null;

  const endTime = item.endTime?.trim();
  if (endTime) {
    const end = parseTime(endTime);
    if (end === null) return null;
    const endOffsetDays = item.endOffsetDays ?? 0;
    const endWithOffset = end + endOffsetDays * 24 * 60;
    if (endWithOffset <= start) return null;
    return { item, start, end: endWithOffset };
  }

  if (
    item.durationMinutes === null ||
    item.durationMinutes === undefined ||
    item.durationMinutes <= 0
  ) {
    return null;
  }

  return { item, start, end: start + item.durationMinutes };
}
