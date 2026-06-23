import {
  displayDateTimeLocaleCode,
  formatDisplayDateTime,
} from "@/src/shared/date-time-display";

export function formatDateTime(value: string, locale: "en" | "th"): string {
  return formatDisplayDateTime(value, displayDateTimeLocaleCode(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
