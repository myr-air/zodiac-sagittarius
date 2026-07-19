export type AuthLocale = "EN" | "TH";

export const AUTH_LOCALE_STORAGE_KEY = "joii.auth.locale";

export type AuthLocaleStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function isAuthLocale(value: unknown): value is AuthLocale {
  return value === "EN" || value === "TH";
}

/** Read frozen locale; default EN when missing or invalid. */
export function loadAuthLocale(
  storage: AuthLocaleStorage | null | undefined,
): AuthLocale {
  if (!storage) return "EN";
  try {
    const raw = storage.getItem(AUTH_LOCALE_STORAGE_KEY);
    return isAuthLocale(raw) ? raw : "EN";
  } catch {
    return "EN";
  }
}

/** Persist locale so it stays frozen across auth pages and reloads. */
export function saveAuthLocale(
  storage: AuthLocaleStorage | null | undefined,
  locale: AuthLocale,
): void {
  if (!storage) return;
  try {
    storage.setItem(AUTH_LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore quota / private mode */
  }
}
