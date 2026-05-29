import { describe, expect, it, vi } from "vitest";
import { createBrowserStorageDriver } from "./storage";

describe("browser trip storage driver", () => {
  it("uses localStorage when the browser window is available", () => {
    const localStorage = {
      getItem: vi.fn(() => "draft"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: localStorage,
    });
    const driver = createBrowserStorageDriver();

    expect(driver.load("trip")).toBe("draft");
    driver.save("trip", "value");
    driver.remove("trip");

    expect(localStorage.getItem).toHaveBeenCalledWith("trip");
    expect(localStorage.setItem).toHaveBeenCalledWith("trip", "value");
    expect(localStorage.removeItem).toHaveBeenCalledWith("trip");
  });

  it("does nothing when called outside the browser", () => {
    const originalWindow = globalThis.window;
    Reflect.deleteProperty(globalThis, "window");
    const driver = createBrowserStorageDriver();

    expect(driver.load("trip")).toBeNull();
    expect(() => driver.save("trip", "value")).not.toThrow();
    expect(() => driver.remove("trip")).not.toThrow();

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });
});
