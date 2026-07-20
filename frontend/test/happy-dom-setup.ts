import { GlobalRegistrator } from "@happy-dom/global-registrator";

/** Preload for bun test — register before @testing-library binds screen. */
if (!(globalThis as { __joiiHappyDom?: boolean }).__joiiHappyDom) {
  GlobalRegistrator.register();
  (globalThis as { __joiiHappyDom?: boolean }).__joiiHappyDom = true;
}
