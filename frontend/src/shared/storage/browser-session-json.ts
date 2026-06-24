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

function clearBrowserSessionJson(key: string, sessionStorage: Storage, legacyStorage: Storage | null) {
  sessionStorage.removeItem(key);
  legacyStorage?.removeItem(key);
}

export function loadBrowserSessionJson<T>(
  key: string,
  isValid: (value: T) => boolean,
): T | null {
  const sessionStorage = getBrowserSessionStorage();
  if (!sessionStorage) return null;

  const legacyStorage = getBrowserLocalStorage();
  const rawValue = sessionStorage.getItem(key) ?? legacyStorage?.getItem(key);
  if (!rawValue) return null;

  try {
    const value = JSON.parse(rawValue) as T;
    if (!isValid(value)) {
      clearBrowserSessionJson(key, sessionStorage, legacyStorage);
      return null;
    }
    if (legacyStorage?.getItem(key) === rawValue) {
      sessionStorage.setItem(key, rawValue);
      legacyStorage.removeItem(key);
    }
    return value;
  } catch {
    clearBrowserSessionJson(key, sessionStorage, legacyStorage);
    return null;
  }
}

export function persistBrowserSessionJson<T>(key: string, value: T | null) {
  const sessionStorage = getBrowserSessionStorage();
  if (!sessionStorage) return;

  if (value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  } else {
    sessionStorage.removeItem(key);
  }
  getBrowserLocalStorage()?.removeItem(key);
}

export function clearBrowserSessionStorageValue(key: string) {
  getBrowserSessionStorage()?.removeItem(key);
  getBrowserLocalStorage()?.removeItem(key);
}
