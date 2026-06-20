import { loadBrowserSessionJson, persistBrowserSessionJson } from "@/src/shared/storage/browser-session-json";
import type { AccountSession } from "./api-client";

export const accountSessionStorageKey = "sagittarius-account-session";

export function loadPersistedAccountSession(): AccountSession | null {
  return loadBrowserSessionJson<AccountSession>(
    accountSessionStorageKey,
    (session) =>
      session.kind === "trusted" &&
      Date.parse(session.expiresAt) > Date.now(),
  );
}

export function persistAccountSession(session: AccountSession | null) {
  persistBrowserSessionJson(
    accountSessionStorageKey,
    session?.kind === "trusted" ? session : null,
  );
}
