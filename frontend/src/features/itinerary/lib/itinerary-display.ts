import type { Locale } from "@/src/i18n/types";
import { displayDateTimeLocaleCode } from "@/src/shared/date-time-display";
export { activityTypeLabel } from "../domain/itinerary-activity-types";
export { dayRouteLabel } from "../domain/itinerary-day-route-labels";
export {
  formatDuration,
  formatEndTime,
  formatTimeWindow,
} from "../domain/itinerary-time-display";

export function formatThaiDate(value: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(displayDateTimeLocaleCode(locale), {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
