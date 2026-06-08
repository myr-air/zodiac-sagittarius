"use client";

import { useEffect, useId, useRef, useState, type HTMLAttributes } from "react";
import { Icon } from "@/src/components/icons";
import { cn } from "@/src/lib/cn";
import { majorCurrencyOptions, normalizeCurrencyCode, type MajorCurrencyCode } from "@/src/trip/currencies";
import { useI18n } from "./I18nProvider";
import type { Locale } from "./types";

export const currencyStorageKey = "sagittarius-currency";

const languageOptions: Array<{ locale: Locale; label: string; detail: string; shortLabel: string }> = [
  { locale: "en", label: "English", detail: "English", shortLabel: "EN" },
  { locale: "th", label: "ภาษาไทย", detail: "Thai", shortLabel: "TH" },
];

const rootClassName = [
  "language-switch",
  "relative",
  "inline-flex",
  "w-fit",
  "max-w-full",
  "items-center",
];

const triggerClassName = [
  "language-switch-trigger",
  "inline-flex",
  "min-h-10",
  "max-w-full",
  "items-center",
  "justify-center",
  "gap-2",
  "rounded-(--radius-md)",
  "border",
  "border-(--color-border)",
  "bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)]",
  "px-3",
  "text-[12px]",
  "font-extrabold",
  "leading-4",
  "text-(--color-primary-strong)",
  "shadow-[0_10px_22px_rgb(15_23_42_/_0.06)]",
  "transition-[background,border-color,box-shadow]",
  "duration-150",
  "hover:border-(--color-primary-border)",
  "hover:bg-(--color-surface)",
  "[&_.icon]:size-4",
];

const menuClassName = [
  "language-switch-menu",
  "absolute",
  "right-0",
  "top-[calc(100%+8px)]",
  "z-30",
  "grid",
  "w-[min(344px,calc(100vw-24px))]",
  "gap-3",
  "rounded-(--radius-lg)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "p-3",
  "shadow-[0_24px_70px_rgb(15_23_42_/_0.18)]",
  "max-[767px]:left-0",
  "max-[767px]:right-auto",
];

const sectionClassName = ["grid", "gap-2"];
const sectionLabelClassName = "text-[11px] font-black uppercase leading-4 text-(--color-text-muted)";
const optionGridClassName = "grid grid-cols-2 gap-2";

const optionClassName = [
  "language-switch-option",
  "grid",
  "min-h-[46px]",
  "grid-cols-[minmax(0,1fr)_auto]",
  "items-center",
  "gap-2",
  "rounded-(--radius-md)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface-subtle)",
  "px-3",
  "text-left",
  "text-[13px]",
  "font-extrabold",
  "text-(--color-text)",
  "transition-[background,border-color,color]",
  "duration-150",
  "hover:border-(--color-primary-border)",
  "hover:bg-(--color-primary-soft)",
];

const activeOptionClassName = [
  "language-switch-option--active",
  "border-(--color-primary-border)",
  "bg-(--color-primary-soft)",
  "text-(--color-primary-strong)",
  "[&_.language-switch-option-detail]:text-current",
  "[&_.language-switch-option-meta]:text-current",
];

const optionDetailClassName = "language-switch-option-detail block truncate text-[11px] font-bold leading-4 text-(--color-text-muted)";
const optionMetaClassName = "language-switch-option-meta text-[11px] font-black text-(--color-text-muted)";
const checkClassName = "text-(--color-primary) opacity-0 data-[active=true]:opacity-100";

export function LanguageSwitch({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<MajorCurrencyCode>("HKD");
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const activeLanguage = languageOptions.find((option) => option.locale === locale) ?? languageOptions[0];

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCurrency(readStoredCurrency());
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function chooseLanguage(nextLocale: Locale) {
    setLocale(nextLocale);
    setOpen(false);
  }

  function chooseCurrency(nextCurrency: MajorCurrencyCode) {
    setCurrency(nextCurrency);
    try {
      window.localStorage.setItem(currencyStorageKey, nextCurrency);
    } catch {
      // In-memory choice is still useful for the current session.
    }
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn(rootClassName, className)} {...props}>
      <button
        type="button"
        className={cn(triggerClassName)}
        aria-label={t.common.language.currencyLabel}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="wallet" />
        <span className="truncate">{activeLanguage.shortLabel} / {currency}</span>
        <Icon name="chevronRight" className={cn("transition-transform duration-150", open ? "-rotate-90" : "rotate-90")} />
      </button>

      {open ? (
        <div id={menuId} className={cn(menuClassName)} role="menu" aria-label={t.common.language.currencyLabel}>
          <section className={cn(sectionClassName)} aria-labelledby={`${menuId}-language`}>
            <strong id={`${menuId}-language`} className={sectionLabelClassName}>{t.common.language.label}</strong>
            <div className={optionGridClassName}>
              {languageOptions.map((option) => {
                const isActive = option.locale === locale;
                return (
                  <button
                    type="button"
                    key={option.locale}
                    className={cn(optionClassName, isActive ? activeOptionClassName : "")}
                    role="menuitemradio"
                    aria-checked={isActive}
                    aria-label={option.label}
                    onClick={() => chooseLanguage(option.locale)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{option.shortLabel}</span>
                      <span className={optionDetailClassName}>{option.label}</span>
                    </span>
                    <Icon name="check" className={checkClassName} data-active={isActive ? "true" : "false"} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className={cn(sectionClassName)} aria-labelledby={`${menuId}-currency`}>
            <strong id={`${menuId}-currency`} className={sectionLabelClassName}>{t.common.currency.label}</strong>
            <div className={optionGridClassName}>
              {majorCurrencyOptions.map((option) => {
                const isActive = option.code === currency;
                return (
                  <button
                    type="button"
                    key={option.code}
                    className={cn(optionClassName, isActive ? activeOptionClassName : "")}
                    role="menuitemradio"
                    aria-checked={isActive}
                    aria-label={option.code}
                    onClick={() => chooseCurrency(option.code)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{option.code}</span>
                      <span className={optionDetailClassName}>{option.label}</span>
                    </span>
                    <span className={optionMetaClassName}>{option.symbol}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function readStoredCurrency(): MajorCurrencyCode {
  try {
    const stored = window.localStorage.getItem(currencyStorageKey);
    return stored ? normalizeCurrencyCode(stored) : "HKD";
  } catch {
    return "HKD";
  }
}
