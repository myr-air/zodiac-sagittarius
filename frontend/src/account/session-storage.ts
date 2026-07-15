import { clearBrowserSessionStorageValue } from "@/src/shared/storage/browser-session-json";
import type { AccountSession } from "./api-client";

export const accountSessionStorageKey = "sagittarius-account-session";

export function loadPersistedAccountSession(): AccountSession | null {
  clearBrowserSessionStorageValue(accountSessionStorageKey);
  return null;
}

export function persistAccountSession() {
  clearBrowserSessionStorageValue(accountSessionStorageKey);
}
