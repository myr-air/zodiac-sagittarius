import { describe, expect, it, vi } from "vitest";
import { unregisterLegacyServiceWorker } from "./unregister-legacy-service-worker";

describe("unregisterLegacyServiceWorker", () => {
  it("unregisters all service workers and deletes joii-* caches", async () => {
    const unregisterA = vi.fn(async () => true);
    const unregisterB = vi.fn(async () => true);
    const killUnregister = vi.fn(async () => true);
    const register = vi.fn(async () => ({ unregister: killUnregister }));
    const deleteCache = vi.fn(async (key: string) => key.startsWith("joii"));
    const getRegistrations = vi.fn(async () => [
      { unregister: unregisterA },
      { unregister: unregisterB },
    ]);

    const result = await unregisterLegacyServiceWorker({
      serviceWorker: {
        getRegistrations,
        register,
      } as unknown as ServiceWorkerContainer,
      caches: {
        keys: async () => ["joii-v2", "other-app", "joii-tiles"],
        delete: deleteCache,
      } as unknown as CacheStorage,
    });

    expect(unregisterA).toHaveBeenCalledTimes(1);
    expect(unregisterB).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    expect(killUnregister).toHaveBeenCalledTimes(1);
    expect(deleteCache).toHaveBeenCalledWith("joii-v2");
    expect(deleteCache).toHaveBeenCalledWith("joii-tiles");
    expect(deleteCache).not.toHaveBeenCalledWith("other-app");
    expect(result).toEqual({
      unregistered: 2,
      cachesDeleted: ["joii-v2", "joii-tiles"],
    });
  });

  it("no-ops when service worker APIs are missing", async () => {
    await expect(unregisterLegacyServiceWorker({})).resolves.toEqual({
      unregistered: 0,
      cachesDeleted: [],
    });
  });
});
