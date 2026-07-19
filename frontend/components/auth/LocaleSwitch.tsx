"use client";

import { authChrome } from "@/src/auth/auth-chrome";
import type { AuthLocale } from "@/src/auth/locale";
import { useAuthLocale } from "./AuthLocaleProvider";

const LOCALES: ReadonlyArray<AuthLocale> = ["EN", "TH"];

type LocaleSwitchProps = {
  /** Extra class on the outer group (e.g. landing density). */
  className?: string;
};

/** Shared EN/TH control — persists via `joii.auth.locale` (auth + landing). */
export function LocaleSwitch({ className = "" }: LocaleSwitchProps) {
  const { locale, setLocale, copy } = useAuthLocale();
  const motionClass = authChrome().motion.transitionClassName;

  return (
    <div
      className={`inline-flex rounded-[13px] border border-(--color-border) bg-(--color-surface-muted) p-[3px] ${className}`}
      role="group"
      aria-label={copy.languageGroup}
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          onClick={() => setLocale(option)}
          className={`min-h-[30px] min-w-10 rounded-lg border-0 text-xs font-bold ${motionClass} ${
            locale === option
              ? "bg-(--color-surface) text-(--color-primary-strong) shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
              : "bg-transparent text-(--color-text-muted)"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
