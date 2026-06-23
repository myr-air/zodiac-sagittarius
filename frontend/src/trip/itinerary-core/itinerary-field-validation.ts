import type { ItineraryItem, ValidationWarning } from "../types";
import { parseTime } from "./itinerary-time";

export function validateItemFields(item: ItineraryItem): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const start = parseTime(item.startTime);
  const isFlexible = item.timeMode === "flexible";

  if (!isFlexible && !item.startTime.trim()) {
    warnings.push({ code: "missing-start-time", message: "Add a start time before this stop can appear in Now / Next.", itemId: item.id });
  } else if (!isFlexible && start === null) {
    warnings.push({ code: "invalid-start-time", message: "Use 24-hour time, for example 13:30.", itemId: item.id });
  }

  if (!isFlexible && !item.endTime && (item.durationMinutes === null || item.durationMinutes <= 0)) {
    warnings.push({ code: "missing-duration", message: "Add an end time or duration so route timing can be checked.", itemId: item.id });
  }

  if (!item.mapLink.trim()) {
    warnings.push({ code: "missing-map-link", message: "Add a map link or place fallback for this stop.", itemId: item.id });
  }

  if (!item.transportation.trim()) {
    warnings.push({ code: "missing-transportation", message: "Add transport notes so the group knows the next move.", itemId: item.id });
  }

  return warnings;
}
