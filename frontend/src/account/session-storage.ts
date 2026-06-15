import type { AccountSession } from "./api-client";

const accountSessionStorageKey = "sagittarius-account-session";

function getBrowserLocalStorage(): Storage | null {
  if (
    typeof window === "undefined" ||
    !("localStorage" in window) ||
    !window.localStorage
  )
    return null;
  return window.localStorage;
}

function getBrowserSessionStorage(): Storage | null {
  if (
    typeof window === "undefined" ||
    !("sessionStorage" in window) ||
    !window.sessionStorage
  )
    return null;
  return window.sessionStorage;
}

export function loadPersistedAccountSession(): AccountSession | null {
  const storage = getBrowserSessionStorage();
  if (!storage) return null;
  const legacyStorage = getBrowserLocalStorage();
  const rawSession =
    storage.getItem(accountSessionStorageKey) ??
    legacyStorage?.getItem(accountSessionStorageKey);
  if (!rawSession) return null;
  try {
    const session = JSON.parse(rawSession) as AccountSession;
    if (
      session.kind !== "trusted" ||
      Date.parse(session.expiresAt) <= Date.now()
    ) {
      storage.removeItem(accountSessionStorageKey);
      legacyStorage?.removeItem(accountSessionStorageKey);
      return null;
    }
    if (legacyStorage?.getItem(accountSessionStorageKey) === rawSession) {
      storage.setItem(accountSessionStorageKey, rawSession);
      legacyStorage.removeItem(accountSessionStorageKey);
    }
    return session;
  } catch {
    storage.removeItem(accountSessionStorageKey);
    legacyStorage?.removeItem(accountSessionStorageKey);
    return null;
  }
}

export function persistAccountSession(session: AccountSession | null) {
  const storage = getBrowserSessionStorage();
  if (!storage) return;
  if (session?.kind === "trusted") {
    storage.setItem(accountSessionStorageKey, JSON.stringify(session));
  } else {
    storage.removeItem(accountSessionStorageKey);
  }
  getBrowserLocalStorage()?.removeItem(accountSessionStorageKey);
}
