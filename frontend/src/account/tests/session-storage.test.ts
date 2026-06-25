import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installBrowserStorage } from "@/src/testing/browser-storage";
import type { AccountSession } from "../api-client";
import {
  accountSessionStorageKey,
  loadPersistedAccountSession,
  persistAccountSession,
} from "../session-storage";

const trustedSession: AccountSession = {
  createdAt: "2026-06-16T00:00:00.000Z",
  expiresAt: "2026-06-21T00:00:00.000Z",
  kind: "trusted",
  sessionToken: "trusted-session-token",
  trustedDeviceId: "trusted-device",
  userId: "user-aom",
};

describe("account session storage", () => {
  let restoreStorage: () => void;

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-06-16T12:00:00.000Z") });
    restoreStorage = installBrowserStorage();
  });

  afterEach(() => {
    vi.useRealTimers();
    restoreStorage();
  });

  it("does not persist trusted account session tokens in browser storage", () => {
    window.localStorage.setItem(accountSessionStorageKey, "legacy");

    persistAccountSession(trustedSession);

    expect(window.sessionStorage.getItem(accountSessionStorageKey)).toBeNull();
    expect(window.localStorage.getItem(accountSessionStorageKey)).toBeNull();
  });

  it("clears legacy trusted sessions instead of restoring readable tokens", () => {
    window.localStorage.setItem(accountSessionStorageKey, JSON.stringify(trustedSession));

    expect(loadPersistedAccountSession()).toBeNull();
    expect(window.sessionStorage.getItem(accountSessionStorageKey)).toBeNull();
    expect(window.localStorage.getItem(accountSessionStorageKey)).toBeNull();
  });

  it("rejects temporary and expired sessions", () => {
    window.sessionStorage.setItem(
      accountSessionStorageKey,
      JSON.stringify({ ...trustedSession, kind: "temporary" }),
    );

    expect(loadPersistedAccountSession()).toBeNull();
    expect(window.sessionStorage.getItem(accountSessionStorageKey)).toBeNull();

    window.sessionStorage.setItem(
      accountSessionStorageKey,
      JSON.stringify({
        ...trustedSession,
        expiresAt: "2026-06-16T00:00:00.000Z",
      }),
    );

    expect(loadPersistedAccountSession()).toBeNull();
    expect(window.sessionStorage.getItem(accountSessionStorageKey)).toBeNull();
  });
});
