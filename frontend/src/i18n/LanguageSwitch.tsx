"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { Icon } from "@/src/ui/icons";
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
  "min-w-10",
  "max-w-full",
  "items-center",
  "justify-center",
  "gap-1.5",
  "rounded-(--radius-md)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "px-3",
  "text-[12px]",
  "font-extrabold",
  "leading-4",
  "text-(--color-text)",
  "shadow-[0_1px_2px_rgb(15_23_42_/_0.06)]",
  "transition-[background,border-color,box-shadow]",
  "duration-150",
  "hover:border-(--color-primary-border)",
  "hover:bg-(--color-primary-soft)",
  "focus-visible:outline-none",
  "focus-visible:border-(--color-primary)",
  "focus-visible:ring-2",
  "focus-visible:ring-[rgb(15_118_110_/_0.16)]",
  "data-[open=true]:border-(--color-primary-border)",
  "data-[open=true]:bg-(--color-primary-soft)",
  "data-[open=true]:text-(--color-primary-strong)",
  "[&_.icon]:size-[15px]",
];

const menuClassName = [
  "language-switch-menu",
  "fixed",
  "z-50",
  "grid",
  "w-[min(320px,calc(100vw-24px))]",
  "max-w-[calc(100vw-24px)]",
  "gap-3",
  "rounded-(--radius-md)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "p-3",
  "shadow-[0_14px_30px_rgb(15_23_42_/_0.14)]",
];

const menuHeaderClassName = "grid gap-1 border-b border-(--color-border) pb-2";
const menuTitleClassName = "text-[13px] font-extrabold leading-5 text-(--color-text)";
const menuSummaryClassName = "text-[11px] font-bold leading-4 text-(--color-text-muted)";
const sectionClassName = ["grid", "gap-2"];
const sectionLabelClassName = "text-[11px] font-extrabold leading-4 text-(--color-text-muted)";
const optionGridClassName = "grid grid-cols-2 gap-2";

const optionClassName = [
  "language-switch-option",
  "grid",
  "min-h-[44px]",
  "grid-cols-[minmax(0,1fr)_auto]",
  "items-center",
  "gap-2",
  "rounded-(--radius-md)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "px-2.5",
  "text-left",
  "text-[12px]",
  "font-extrabold",
  "text-(--color-text)",
  "shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]",
  "transition-[background,border-color,color,box-shadow]",
  "duration-150",
  "hover:border-(--color-primary-border)",
  "hover:bg-(--color-primary-soft)",
  "focus-visible:outline-none",
  "focus-visible:border-(--color-primary)",
  "focus-visible:ring-2",
  "focus-visible:ring-[rgb(15_118_110_/_0.14)]",
];

const activeOptionClassName = [
  "language-switch-option--active",
  "border-(--color-primary-border)",
  "bg-(--color-primary-soft)",
  "text-(--color-primary-strong)",
  "shadow-none",
  "[&_.language-switch-option-detail]:text-current",
  "[&_.language-switch-option-meta]:text-current",
];

const optionDetailClassName = "language-switch-option-detail block truncate text-[11px] font-bold leading-4 text-(--color-text-muted)";
const optionMetaClassName = "language-switch-option-meta inline-flex size-5 items-center justify-center rounded-full bg-(--color-surface-subtle) text-[11px] font-black leading-none text-(--color-text-muted)";
const checkClassName = "text-(--color-primary) opacity-0 data-[active=true]:opacity-100";
const activeCurrencyIconClassName = "language-switch-option-meta text-(--color-primary) [&_.icon]:size-4";
const MENU_WIDTH = 320;
const MENU_GAP = 8;
const VIEWPORT_MARGIN = 12;

export function LanguageSwitch({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<MajorCurrencyCode>("HKD");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({ bottom: "auto", left: VIEWPORT_MARGIN, right: "auto", top: 0 });
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
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
    if (!open) return;

    function placeMenu() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = Math.min(MENU_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
      const menuHeight = menuRef.current?.offsetHeight ?? 444;
      const left = Math.min(
        Math.max(VIEWPORT_MARGIN, rect.right - width),
        Math.max(VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN),
      );
      const hasRoomBelow = rect.bottom + MENU_GAP + menuHeight <= viewportHeight - VIEWPORT_MARGIN;
      const top = hasRoomBelow
        ? rect.bottom + MENU_GAP
        : Math.max(VIEWPORT_MARGIN, rect.top - menuHeight - MENU_GAP);

      setMenuStyle({ bottom: "auto", left, right: "auto", top, width });
    }

    placeMenu();
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [currency, locale, open]);

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
        ref={triggerRef}
        type="button"
        className={cn(triggerClassName)}
        data-open={open ? "true" : "false"}
        aria-label={t.common.language.currencyLabel}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="wallet" className="text-(--color-primary-strong)" />
        <span className="truncate">{activeLanguage.shortLabel} / {currency}</span>
        <Icon name="chevronRight" className={cn("text-(--color-text-muted) transition-transform duration-150", open ? "-rotate-90" : "rotate-90")} />
      </button>

      {open ? (
        <div ref={menuRef} id={menuId} className={cn(menuClassName)} role="menu" aria-label={t.common.language.currencyLabel} style={menuStyle}>
          <div className={menuHeaderClassName}>
            <strong className={menuTitleClassName}>{t.common.language.currencyLabel}</strong>
            <span className={menuSummaryClassName}>{activeLanguage.label} · {currency}</span>
          </div>

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
                    {isActive ? (
                      <span className={activeCurrencyIconClassName}>
                        <Icon name="check" />
                      </span>
                    ) : (
                      <span className={optionMetaClassName}>{option.symbol}</span>
                    )}
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
