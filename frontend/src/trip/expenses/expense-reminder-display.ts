import {
  displayGregorianDateTimeLocaleCode,
  formatOptionalDisplayDateTime,
  type DisplayDateTimeLocale,
} from "@/src/shared/date-time-display";

export function formatReminderDate(value: string, locale: DisplayDateTimeLocale): string {
  return formatOptionalDisplayDateTime({
    emptyValue: "",
    invalidValue: (input) => input,
    locale: displayGregorianDateTimeLocaleCode(locale),
    options: {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      year: "numeric",
    },
    value,
  });
}
