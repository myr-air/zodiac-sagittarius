import { describe, expect, it } from "vitest";
import {
  createMutableMemoryStorage,
  installLocalStorageStub,
  installSessionStorageStub,
} from "./browser-storage";

describe("browser storage test helpers", () => {
  it("supports normal Storage reads and writes", () => {
    const storage = createMutableMemoryStorage();

    storage.setItem("locale", "th");
    storage.setItem("currency", "HKD");

    expect(storage.getItem("locale")).toBe("th");
    expect(storage.key(1)).toBe("currency");
    expect(storage.length).toBe(2);
    storage.removeItem("locale");
    expect(storage.getItem("locale")).toBeNull();
  });

  it("can simulate write failures without blocking reads", () => {
    const storage = createMutableMemoryStorage();
    storage.setItem("locale", "en");

    storage.setWriteFailure(true);

    expect(() => storage.setItem("locale", "th")).toThrow("Storage write failed");
    expect(storage.getItem("locale")).toBe("en");
  });

  it("installs local and session storage stubs on window", () => {
    const localStorage = installLocalStorageStub();
    const sessionStorage = installSessionStorageStub();

    localStorage.setItem("trip", "local");
    sessionStorage.setItem("trip", "session");

    expect(window.localStorage.getItem("trip")).toBe("local");
    expect(window.sessionStorage.getItem("trip")).toBe("session");
  });
});
