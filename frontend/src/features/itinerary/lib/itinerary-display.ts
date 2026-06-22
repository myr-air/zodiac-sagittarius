import type { Locale } from "@/src/i18n/types";
import { displayDateTimeLocaleCode } from "@/src/shared/date-time-display";
export { activityTypeLabel } from "../domain/itinerary-activity-types";
export {
  formatDuration,
  formatEndTime,
  formatTimeWindow,
} from "../domain/itinerary-time-display";

export function dayRouteLabel(day: string, locale: Locale = "en"): string {
  if (day === "2026-06-18") return "Bangkok -> Hong Kong";
  if (day === "2025-05-16") return "Hong Kong City Day";
  if (day === "2025-05-17") return "Hong Kong -> Shenzhen";
  return locale === "th" ? "วันในทริป" : "Trip day";
}

export function formatThaiDate(value: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(displayDateTimeLocaleCode(locale), {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
