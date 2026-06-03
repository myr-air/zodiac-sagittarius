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
  "border-[var(--border-subtle,var(--color-border))]",
  "bg-[color-mix(in_srgb,var(--surface,var(--color-surface))_88%,transparent)]",
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
  "text-[var(--text-muted,var(--color-text-muted))]",
];

const activeOptionClassName = [
  "language-switch-option--active",
  "bg-[var(--text-strong,var(--color-text))]",
  "text-[var(--surface,var(--color-surface))]",
];

export function LanguageSwitch({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={cn(switchClassName, className)} role="group" aria-label={t.common.language.label} {...props}>
      {options.map((option) => (
        <button
          type="button"
          key={option.locale}
          className={cn(optionClassName, option.locale === locale && activeOptionClassName)}
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
