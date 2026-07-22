/**
 * Tear down the pre-reset Joii PWA (`joii-v2` / `/sw.js`) so it cannot
 * intercept API traffic after the Next.js greenfield shell.
 */
export async function unregisterLegacyServiceWorker(
  deps: {
    serviceWorker?: ServiceWorkerContainer;
    caches?: CacheStorage;
  } = {},
): Promise<{ unregistered: number; cachesDeleted: string[] }> {
  const sw = deps.serviceWorker;
  const cacheStorage = deps.caches;

  let unregistered = 0;
  const cachesDeleted: string[] = [];

  if (sw?.getRegistrations) {
    const regs = await sw.getRegistrations();
    await Promise.all(
      regs.map(async (reg) => {
        const ok = await reg.unregister();
        if (ok) unregistered += 1;
      }),
    );

    // Nudge browsers that still have the old `/sw.js` to fetch the kill-switch
    // (which then unregisters itself). Safe no-op when already clean.
    try {
      const reg = await sw.register("/sw.js", { scope: "/" });
      await reg.unregister();
    } catch {
      /* register may fail offline / sandboxed — ignore */
    }
  }

  if (cacheStorage?.keys) {
    const keys = await cacheStorage.keys();
    await Promise.all(
      keys.map(async (key) => {
        if (key === "joii-v2" || key.startsWith("joii-")) {
          const ok = await cacheStorage.delete(key);
          if (ok) cachesDeleted.push(key);
        }
      }),
    );
  }

  return { unregistered, cachesDeleted };
}
