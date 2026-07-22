import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * happy-dom under Node 25+ can leave `window.localStorage` undefined while
 * still providing sessionStorage. Account/settings suites need localStorage.
 */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, String(value));
    },
  };
}

if (typeof window !== "undefined" && window.localStorage == null) {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    enumerable: true,
    value: memoryStorage(),
  });
}

afterEach(() => {
  cleanup();
});
