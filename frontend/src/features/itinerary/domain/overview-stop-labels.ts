import type { Locale } from "@/src/i18n/types";
import { formatDayLabel } from "@/src/trip/itinerary-core";
import type { ItineraryItem } from "@/src/trip/types";

export function formatOverviewStopSchedule(
  item: Pick<ItineraryItem, "day" | "startTime">,
  startDate: string,
  locale: Locale,
): string {
  return `${formatDayLabel(item.day, startDate, locale)} · ${item.startTime}`;
}

export function formatOverviewStopScheduleWithPlace(
  item: Pick<ItineraryItem, "day" | "place" | "startTime">,
  startDate: string,
  locale: Locale,
): string {
  return `${formatOverviewStopSchedule(item, startDate, locale)} · ${item.place}`;
}
