"use client";

import { useI18n } from "./I18nProvider";
import type { Locale } from "./types";

const options: Array<{ locale: Locale; label: string }> = [
  { locale: "en", label: "EN" },
  { locale: "th", label: "TH" },
];

export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={["language-switch", className].filter(Boolean).join(" ")} role="group" aria-label={t.common.language.label}>
      {options.map((option) => (
        <button
          type="button"
          key={option.locale}
          className={option.locale === locale ? "language-switch-option language-switch-option--active" : "language-switch-option"}
          aria-pressed={option.locale === locale}
          aria-label={option.locale === "en" ? t.common.language.switchToEnglish : t.common.language.switchToThai}
          onClick={() => setLocale(option.locale)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
