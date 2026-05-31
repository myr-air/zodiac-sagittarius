"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { getMessages, type Messages } from "./messages";
import { defaultLocale, isLocale, type Locale } from "./types";

export const localeStorageKey = "sagittarius-locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== localeStorageKey) {
        return;
      }

      setLocaleState(isLocale(event.newValue) ? event.newValue : defaultLocale);
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    function setLocale(nextLocale: Locale) {
      setLocaleState(nextLocale);
      try {
        window.localStorage.setItem(localeStorageKey, nextLocale);
      } catch {
        // Keep the in-memory language switch working when storage is blocked.
      }
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
    return defaultLocale;
  }

  try {
    const stored = window.localStorage.getItem(localeStorageKey);
    return isLocale(stored) ? stored : defaultLocale;
  } catch {
    return defaultLocale;
  }
}
