"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { Icon } from "@/src/ui/icons";
import { cn } from "@/src/lib/cn";
import { majorCurrencyOptions, type MajorCurrencyCode } from "@/src/trip/currencies";
import { useI18n } from "./I18nProvider";
import type { Locale } from "./types";
import {
  activeCurrencyIconClassName,
  activeOptionClassName,
  checkClassName,
  currencyStorageKey,
  languageOptions,
  MENU_GAP,
  MENU_WIDTH,
  menuClassName,
  menuHeaderClassName,
  menuSummaryClassName,
  menuTitleClassName,
  optionClassName,
  optionDetailClassName,
  optionGridClassName,
  optionMetaClassName,
  readStoredCurrency,
  rootClassName,
  sectionClassName,
  sectionLabelClassName,
  triggerClassName,
  VIEWPORT_MARGIN,
} from "./language-switch.support";

export { currencyStorageKey };

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
