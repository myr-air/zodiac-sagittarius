import type { ItineraryItem } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import {
  toggleId,
  uniqueIds,
} from "@/src/shared/collection";
import { readItineraryDetailString } from "@/src/trip/itinerary-items";
import {
  fromDateTimeLocalValue,
  itineraryDateTimeValue,
  durationBetweenTimes,
  endOffsetDaysBetweenTimes,
  parseTimeToMinutes,
  toDateTimeLocalValue,
} from "../lib/itinerary-time";
import {
  activityTypeOptions,
  buildActivitySubtypePatch,
  buildActivityTypePatch,
} from "./itinerary-activity-types";
import {
  formatDuration,
  formatTimeRangeLabel,
} from "./itinerary-time-display";
import {
  normalizeTravelSubtype,
  travelSubtypeForItem,
  travelSubtypeOptions,
  type TravelSubtype,
  withoutTravelSubtypeDetails,
} from "./itinerary-travel-subtypes";
import {
  bookingDocTypeForItemTemplate,
  bookingIconForItem,
  bookingTemplateForItem,
  bookingTemplateLabel,
  bookingTitleForItem,
  formatBookingSummary,
  ticketModalCopy,
  ticketNotesForItem,
} from "./itinerary-booking-display";

function formatTimeTooltip(
  item: Pick<ItineraryItem, "startTime" | "endTime" | "endOffsetDays" | "durationMinutes">,
  locale: Locale,
): string {
  const startTime = item.startTime?.trim() || "--:--";
  const endTime = item.endTime?.trim();
  const lines = [
    endTime
      ? formatTimeRangeLabel(startTime, endTime, item.endOffsetDays ?? 0)
      : startTime,
  ];
  if (endTime && item.durationMinutes) {
    lines.push(formatDuration(item.durationMinutes, locale));
  }
  return lines.join("\n");
}

export {
  activityTypeOptions,
  bookingDocTypeForItemTemplate,
  bookingIconForItem,
  bookingTemplateForItem,
  bookingTemplateLabel,
  bookingTitleForItem,
  buildActivitySubtypePatch,
  buildActivityTypePatch,
  durationBetweenTimes,
  endOffsetDaysBetweenTimes,
  formatBookingSummary,
  formatTimeRangeLabel,
  formatTimeTooltip,
  fromDateTimeLocalValue,
  itineraryDateTimeValue,
  normalizeTravelSubtype,
  parseTimeToMinutes,
  readItineraryDetailString,
  toDateTimeLocalValue,
  ticketModalCopy,
  ticketNotesForItem,
  travelSubtypeForItem,
  travelSubtypeOptions,
  uniqueIds,
  withoutTravelSubtypeDetails,
  toggleId,
};

export type { TravelSubtype };
