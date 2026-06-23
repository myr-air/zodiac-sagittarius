import type { Locale } from "./types";

export interface LanguageOption {
  detail: string;
  label: string;
  locale: Locale;
  shortLabel: string;
}

export const languageOptions: LanguageOption[] = [
  { locale: "en", label: "English", detail: "English", shortLabel: "EN" },
  { locale: "th", label: "ภาษาไทย", detail: "Thai", shortLabel: "TH" },
];
