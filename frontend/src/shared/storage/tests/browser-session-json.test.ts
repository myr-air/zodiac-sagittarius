import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installBrowserStorage } from "@/src/testing/browser-storage";
import {
  clearBrowserSessionStorageValue,
  loadBrowserSessionJson,
  persistBrowserSessionJson,
} from "../browser-session-json";

describe("browser-session-json", () => {
  let restoreStorage: () => void;

  beforeEach(() => {
    restoreStorage = installBrowserStorage();
  });

  afterEach(() => {
    restoreStorage();
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
