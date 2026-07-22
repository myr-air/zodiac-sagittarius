"use client";

import { useEffect } from "react";
import { unregisterLegacyServiceWorker } from "@/src/pwa/unregister-legacy-service-worker";

/** One-shot client mount: drop legacy Joii PWA workers/caches. */
export function UnregisterLegacyServiceWorker() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    void unregisterLegacyServiceWorker({
      serviceWorker: navigator.serviceWorker,
      caches: typeof caches !== "undefined" ? caches : undefined,
    });
  }, []);

  return null;
}
