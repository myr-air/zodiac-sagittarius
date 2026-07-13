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

export function I18nProvider({ children, initialLocale = defaultLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLocaleState(readStoredLocale(initialLocale));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initialLocale]);

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

function readStoredLocale(fallback: Locale = defaultLocale): Locale {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const urlLocale = new URL(window.location.href).searchParams.get("locale");
    if (isLocale(urlLocale)) return urlLocale;

    const stored = window.localStorage.getItem(localeStorageKey);
    if (isLocale(stored)) return stored;

    const navigatorLang = navigator.language?.slice(0, 2);
    if (isLocale(navigatorLang)) return navigatorLang;

    return fallback;
  } catch {
    return fallback;
  }
}
