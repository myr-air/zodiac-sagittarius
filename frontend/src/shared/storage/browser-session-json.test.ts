import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearBrowserSessionStorageValue,
  loadBrowserSessionJson,
  persistBrowserSessionJson,
} from "./browser-session-json";

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

describe("browser-session-json", () => {
  let originalWindow: typeof globalThis.window | undefined;

  beforeEach(() => {
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
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
      return;
    }
    Reflect.deleteProperty(globalThis, "window");
  });

  it("loads sessionStorage JSON before legacy localStorage", () => {
    window.sessionStorage.setItem(
      "session-key",
      JSON.stringify({ source: "session" }),
    );
    window.localStorage.setItem("session-key", JSON.stringify({ source: "legacy" }));

    expect(
      loadBrowserSessionJson<{ source: string }>("session-key", () => true),
    ).toEqual({ source: "session" });
    expect(window.localStorage.getItem("session-key")).not.toBeNull();
  });

  it("migrates valid legacy localStorage JSON into sessionStorage", () => {
    window.localStorage.setItem("session-key", JSON.stringify({ source: "legacy" }));

    expect(
      loadBrowserSessionJson<{ source: string }>("session-key", () => true),
    ).toEqual({ source: "legacy" });
    expect(window.sessionStorage.getItem("session-key")).toBe(
      JSON.stringify({ source: "legacy" }),
    );
    expect(window.localStorage.getItem("session-key")).toBeNull();
  });

  it("clears current and legacy storage for invalid JSON or invalid values", () => {
    window.sessionStorage.setItem("bad-json", "{bad");
    window.localStorage.setItem("bad-json", JSON.stringify({ ok: true }));

    expect(loadBrowserSessionJson("bad-json", () => true)).toBeNull();
    expect(window.sessionStorage.getItem("bad-json")).toBeNull();
    expect(window.localStorage.getItem("bad-json")).toBeNull();

    window.sessionStorage.setItem("invalid-value", JSON.stringify({ ok: false }));
    window.localStorage.setItem("invalid-value", JSON.stringify({ ok: false }));

    expect(
      loadBrowserSessionJson<{ ok: boolean }>(
        "invalid-value",
        (value) => value.ok,
      ),
    ).toBeNull();
    expect(window.sessionStorage.getItem("invalid-value")).toBeNull();
    expect(window.localStorage.getItem("invalid-value")).toBeNull();
  });

  it("persists session JSON and clears legacy storage", () => {
    window.localStorage.setItem("session-key", "legacy");

    persistBrowserSessionJson("session-key", { ok: true });

    expect(window.sessionStorage.getItem("session-key")).toBe(
      JSON.stringify({ ok: true }),
    );
    expect(window.localStorage.getItem("session-key")).toBeNull();
  });

  it("clears session and legacy storage", () => {
    window.sessionStorage.setItem("session-key", "current");
    window.localStorage.setItem("session-key", "legacy");

    clearBrowserSessionStorageValue("session-key");

    expect(window.sessionStorage.getItem("session-key")).toBeNull();
    expect(window.localStorage.getItem("session-key")).toBeNull();
  });
});
