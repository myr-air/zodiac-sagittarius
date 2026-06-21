import { describe, expect, it } from "vitest";
import { installLocalStorageStub } from "@/src/testing/browser-storage";
import { createBrowserStorageDriver } from "../../persistence";

describe("browser trip storage driver", () => {
  it("uses localStorage when the browser window is available", () => {
    const localStorage = installLocalStorageStub();
    localStorage.setItem("trip", "draft");
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
