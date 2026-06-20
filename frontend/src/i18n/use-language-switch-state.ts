"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { MajorCurrencyCode } from "@/src/trip/currencies";
import type { Locale } from "./types";
import {
  currencyStorageKey,
  languageOptions,
  MENU_GAP,
  MENU_WIDTH,
  readStoredCurrency,
  VIEWPORT_MARGIN,
} from "./language-switch.support";

interface UseLanguageSwitchStateInput {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export function useLanguageSwitchState({
  locale,
  setLocale,
}: UseLanguageSwitchStateInput) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<MajorCurrencyCode>("HKD");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({
    bottom: "auto",
    left: VIEWPORT_MARGIN,
    right: "auto",
    top: 0,
  });
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeLanguage =
    languageOptions.find((option) => option.locale === locale) ??
    languageOptions[0];

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
      const hasRoomBelow =
        rect.bottom + MENU_GAP + menuHeight <=
        viewportHeight - VIEWPORT_MARGIN;
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

  return {
    activeLanguage,
    chooseCurrency,
    chooseLanguage,
    currency,
    menuId,
    menuRef,
    menuStyle,
    open,
    rootRef,
    setOpen,
    triggerRef,
  };
}
