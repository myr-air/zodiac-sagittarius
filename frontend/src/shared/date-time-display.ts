export type DisplayDateTimeLocale = "en" | "th";

export function displayDateTimeLocaleCode(locale: DisplayDateTimeLocale): string {
  return locale === "th" ? "th-TH" : "en-US";
}

export function displayGregorianDateTimeLocaleCode(locale: DisplayDateTimeLocale): string {
  return locale === "th" ? "th-TH-u-ca-gregory" : "en-US";
}

export function formatDisplayDateTime(
  value: string | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function parseDateOnlyValue(value: string): Date | null {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateOnlyDisplay({
  locale,
  options,
  value,
}: {
  locale: string;
  options: Intl.DateTimeFormatOptions;
  value: string;
}): string {
  const date = parseDateOnlyValue(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(locale, options).format(date);
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
