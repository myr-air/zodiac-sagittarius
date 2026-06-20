import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountSession } from "./api-client";
import {
  accountSessionStorageKey,
  loadPersistedAccountSession,
  persistAccountSession,
} from "./session-storage";

const trustedSession: AccountSession = {
  createdAt: "2026-06-16T00:00:00.000Z",
  expiresAt: "2026-06-21T00:00:00.000Z",
  kind: "trusted",
  sessionToken: "trusted-session-token",
  trustedDeviceId: "trusted-device",
  userId: "user-aom",
};

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

describe("account session storage", () => {
  let originalWindow: typeof globalThis.window | undefined;

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-06-16T12:00:00.000Z") });
    originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis.window ?? {},
    });
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
      return;
    }
    Reflect.deleteProperty(globalThis, "window");
  });

  it("persists trusted sessions in sessionStorage and clears legacy localStorage", () => {
    window.localStorage.setItem(accountSessionStorageKey, "legacy");

    persistAccountSession(trustedSession);

    expect(window.sessionStorage.getItem(accountSessionStorageKey)).toBe(
      JSON.stringify(trustedSession),
    );
    expect(window.localStorage.getItem(accountSessionStorageKey)).toBeNull();
  });

  it("loads and migrates valid legacy trusted sessions", () => {
    window.localStorage.setItem(accountSessionStorageKey, JSON.stringify(trustedSession));

    expect(loadPersistedAccountSession()).toEqual(trustedSession);
    expect(window.sessionStorage.getItem(accountSessionStorageKey)).toBe(
      JSON.stringify(trustedSession),
    );
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
