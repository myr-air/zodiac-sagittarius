import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { vi } from "vitest";

/** Preload for bun test — register before @testing-library binds screen. */
if (!(globalThis as { __joiiHappyDom?: boolean }).__joiiHappyDom) {
  GlobalRegistrator.register();
  (globalThis as { __joiiHappyDom?: boolean }).__joiiHappyDom = true;
}

/**
 * Bun's vitest-compat layer omits vi.hoisted; Vitest uses it to share state with
 * vi.mock factories. Identity call is enough when mock/import order is sequential
 * (as in DayMap.test.tsx under bun test).
 */
if (typeof vi.hoisted !== "function") {
  vi.hoisted = (<T>(factory: () => T): T => factory()) as typeof vi.hoisted;
}
