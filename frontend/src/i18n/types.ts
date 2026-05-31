export const supportedLocales = ["en", "th"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "th";
}
