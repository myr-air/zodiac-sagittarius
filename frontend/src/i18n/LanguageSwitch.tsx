"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";
import { useI18n } from "./I18nProvider";
import type { Locale } from "./types";

const options: Array<{ locale: Locale; label: string }> = [
  { locale: "en", label: "EN" },
  { locale: "th", label: "TH" },
];

const switchClassName = [
  "language-switch",
  "inline-flex",
  "items-center",
  "gap-0.5",
  "rounded-full",
  "border",
  "border-[var(--color-border)]",
  "bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)]",
  "p-[3px]",
];

const optionClassName = [
  "language-switch-option",
  "min-h-7",
  "min-w-[38px]",
  "rounded-full",
  "border-0",
  "bg-transparent",
  "text-[0.78rem]",
  "font-bold",
  "text-[var(--color-text-muted)]",
];

const activeOptionClassName = [
  "language-switch-option--active",
  "bg-[var(--color-text)]",
  "text-[var(--color-surface)]",
];

export function LanguageSwitch({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={cn(switchClassName, className)} role="group" aria-label={t.common.language.label} {...props}>
      {options.map((option) => {
        const isActive = option.locale === locale;
        return (
          <button
            type="button"
            key={option.locale}
            className={cn(
              "language-switch-option min-h-7 min-w-[38px] rounded-full border-0 text-[0.78rem] font-bold transition-colors duration-150",
              isActive
                ? "language-switch-option--active bg-[var(--color-text)] text-[var(--color-surface)]"
                : "bg-transparent text-[var(--color-text-muted)]"
            )}
            aria-pressed={isActive}
            aria-label={option.locale === "en" ? t.common.language.switchToEnglish : t.common.language.switchToThai}
            onClick={() => setLocale(option.locale)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
