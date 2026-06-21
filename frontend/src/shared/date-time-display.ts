export type DisplayDateTimeLocale = "en" | "th";

export function displayDateTimeLocaleCode(locale: DisplayDateTimeLocale): string {
  return locale === "th" ? "th-TH" : "en-US";
}

export function formatDisplayDateTime(
  value: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(value));
}

export function formatOptionalDisplayDateTime({
  emptyValue,
  invalidValue,
  locale,
  options,
  value,
}: {
  emptyValue: string;
  invalidValue: (value: string) => string;
  locale: string;
  options: Intl.DateTimeFormatOptions;
  value: string | null | undefined;
}): string {
  if (!value) return emptyValue;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return invalidValue(value);
  return new Intl.DateTimeFormat(locale, options).format(date);
}
