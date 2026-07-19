"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { authCopy, type AuthCopy } from "@/src/auth/auth-copy";
import {
  AUTH_LOCALE_STORAGE_KEY,
  loadAuthLocale,
  saveAuthLocale,
  type AuthLocale,
} from "@/src/auth/locale";

const AUTH_LOCALE_CHANGE_EVENT = "joii-auth-locale-change";

type AuthLocaleContextValue = {
  locale: AuthLocale;
  setLocale: (locale: AuthLocale) => void;
  copy: AuthCopy;
};

const AuthLocaleContext = createContext<AuthLocaleContextValue | null>(null);

function subscribeAuthLocale(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === AUTH_LOCALE_STORAGE_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_LOCALE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTH_LOCALE_CHANGE_EVENT, onStoreChange);
  };
}

function getAuthLocaleSnapshot(): AuthLocale {
  return loadAuthLocale(window.localStorage);
}

function getAuthLocaleServerSnapshot(): AuthLocale {
  return "EN";
}

export function AuthLocaleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useSyncExternalStore(
    subscribeAuthLocale,
    getAuthLocaleSnapshot,
    getAuthLocaleServerSnapshot,
  );

  const setLocale = useCallback((next: AuthLocale) => {
    saveAuthLocale(window.localStorage, next);
    window.dispatchEvent(new Event(AUTH_LOCALE_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      copy: authCopy(locale),
    }),
    [locale, setLocale],
  );

  return (
    <AuthLocaleContext.Provider value={value}>
      {children}
    </AuthLocaleContext.Provider>
  );
}

export function useAuthLocale(): AuthLocaleContextValue {
  const ctx = useContext(AuthLocaleContext);
  if (!ctx) {
    throw new Error("useAuthLocale must be used within AuthLocaleProvider");
  }
  return ctx;
}
