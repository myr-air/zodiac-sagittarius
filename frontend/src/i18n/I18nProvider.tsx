"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { getMessages, type Messages } from "./messages";
import { defaultLocale, isLocale, type Locale } from "./types";

export const localeStorageKey = "sagittarius-locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

let memoryLocale: Locale = defaultLocale;
const localeListeners = new Set<() => void>();

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, readStoredLocale, getServerLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    function setLocale(nextLocale: Locale) {
      memoryLocale = nextLocale;
      try {
        window.localStorage.setItem(localeStorageKey, nextLocale);
      } catch {
        // Keep the in-memory language switch working when storage is blocked.
      }
      emitLocaleChange();
    }

    return { locale, setLocale, t: getMessages(locale) };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return value;
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return getServerLocale();
  }

  try {
    const stored = window.localStorage.getItem(localeStorageKey);
    return isLocale(stored) ? stored : defaultLocale;
  } catch {
    return memoryLocale;
  }
}

function getServerLocale(): Locale {
  return defaultLocale;
}

function subscribeLocale(listener: () => void) {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

function emitLocaleChange() {
  localeListeners.forEach((listener) => listener());
}
