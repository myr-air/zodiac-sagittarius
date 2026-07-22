/**
 * Kill-switch for the pre-reset Joii PWA worker (`joii-v2`).
 *
 * Old browsers still have `/sw.js` registered from the prior SPA. That worker
 * intercepted `/api/*` and cross-origin API calls and could surface
 * "Could not reach the server" after the Next.js reset removed the real SW.
 *
 * This file replaces that script: clear caches, unregister, stop intercepting.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if ("navigate" in client) {
          try {
            await client.navigate(client.url);
          } catch {
            /* ignore navigate failures (opaque clients) */
          }
        }
      }
    })(),
  );
});

/* Pass through if this worker is still briefly in control. */
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
