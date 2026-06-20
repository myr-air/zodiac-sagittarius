import { accountSessionStorageKey } from "@/src/account/session-storage";
import { createMemoryStorage } from "@/src/testing/browser-storage";

export function installLocalStorageStub() {
  const storage = createMemoryStorage();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

export function installSessionStorageStub() {
  const storage = createMemoryStorage();
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

export function persistTrustedAccountSession(
  storage: Pick<Storage, "setItem">,
  sessionToken = "playwright-account-session",
) {
  storage.setItem(
    accountSessionStorageKey,
    JSON.stringify({
      userId: "11111111-1111-1111-1111-111111111111",
      sessionToken,
      kind: "trusted",
      trustedDeviceId: "device-1",
      createdAt: "2026-05-30T10:00:00.000Z",
      expiresAt: "2030-01-01T10:00:00.000Z",
    }),
  );
}
