import type { Locale } from "@/src/i18n/types";
import {
  displayDateTimeLocaleCode,
  formatDateOnlyDisplay,
} from "@/src/shared/date-time-display";
export { activityTypeLabel } from "../domain/itinerary-activity-types";
export { dayRouteLabel } from "../domain/itinerary-day-route-labels";
export {
  formatDuration,
  formatEndTime,
  formatTimeWindow,
} from "../domain/itinerary-time-display";

export function formatThaiDate(value: string, locale: Locale = "en"): string {
  return formatDateOnlyDisplay({
    locale: displayDateTimeLocaleCode(locale),
    options: { day: "numeric", month: "short" },
    value,
  });
}
