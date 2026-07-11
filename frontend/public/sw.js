const CACHE_NAME = "joii-v2";

// Pre-cache static assets on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/manifest.json",
        // Add shell HTML and critical assets
      ]);
    })
  );
  self.skipWaiting();
});

// Clean old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Cache-first for itinerary data, checklist, map tiles
// Network-first for everything else
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Cache-first for itinerary/today data and map tiles (no PII)
  if (
    url.pathname.includes("/api/trips/") &&
    (url.pathname.includes("itinerary") || url.pathname.includes("/plan"))
  ) {
    event.respondWith(cacheFirst(event.request));
  } else if (url.hostname.includes("tile.openfreemap.org")) {
    event.respondWith(cacheFirst(event.request));
  } else if (url.pathname.includes("checklist")) {
    event.respondWith(cacheFirst(event.request));
  } else {
    // Network-first for all other requests (includes member/expense data with PII)
    event.respondWith(networkFirst(event.request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline — data unavailable", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Offline", { status: 503 });
  }
}
