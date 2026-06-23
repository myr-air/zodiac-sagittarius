import { type Dispatch, type SetStateAction, useEffect } from "react";
import type { RouteViewport } from "./route-map.config";
import {
  applyRouteMapTheme,
  removeMapChromeFromTabOrder,
} from "./route-map.live";
import {
  setRouteLiveMapState,
  type RouteLiveMapLifecycleState,
} from "./route-live-map-state";
import { getRouteCenter } from "./route-map.viewport";
import type { useRouteLiveMapRefs } from "./use-route-live-map-refs";

type RouteLiveMapRefs = ReturnType<typeof useRouteLiveMapRefs>;

interface UseRouteLiveMapMountInput {
  cleanupLiveMap: RouteLiveMapRefs["cleanupLiveMap"];
  fallbackViewport: RouteViewport;
  liveMapAvailability: "auto" | "loading" | "error";
  liveMapEnabled: boolean;
  liveRoutePointsRef: RouteLiveMapRefs["liveRoutePointsRef"];
  mapContainerRef: RouteLiveMapRefs["mapContainerRef"];
  maplibreModuleRef: RouteLiveMapRefs["maplibreModuleRef"];
  mapRef: RouteLiveMapRefs["mapRef"];
  retryKey: number;
  setLiveMapLifecycleState: Dispatch<
    SetStateAction<RouteLiveMapLifecycleState>
  >;
}

export function useRouteLiveMapMount({
  cleanupLiveMap,
  fallbackViewport,
  liveMapAvailability,
  liveMapEnabled,
  liveRoutePointsRef,
  mapContainerRef,
  maplibreModuleRef,
  mapRef,
  retryKey,
  setLiveMapLifecycleState,
}: UseRouteLiveMapMountInput) {
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !liveMapEnabled || liveMapAvailability !== "auto") return undefined;

    let disposed = false;
    const liveMapContainer = mapContainerRef.current;

    async function mountLiveMap() {
      setLiveMapLifecycleState((current) =>
        setRouteLiveMapState(current, "loading"),
      );

      try {
        const maplibregl = await import("maplibre-gl");
        if (!mapContainerRef.current || disposed) return;
        maplibreModuleRef.current = maplibregl;
        const container = mapContainerRef.current;
        container.inert = true;

        const map = new maplibregl.Map({
          attributionControl: { compact: true },
          center: getRouteCenter(liveRoutePointsRef.current, fallbackViewport.center),
          container,
          cooperativeGestures: true,
          style: "https://tiles.openfreemap.org/styles/positron",
          zoom: liveRoutePointsRef.current.length > 0 ? 10 : fallbackViewport.zoom,
        });

        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        removeMapChromeFromTabOrder(container);

        map.on("load", () => {
          if (disposed) return;
          applyRouteMapTheme(map);
          container.inert = false;
          setLiveMapLifecycleState((current) =>
            setRouteLiveMapState(current, "ready"),
          );
        });

        map.on("error", () => {
          if (disposed) return;
          setLiveMapLifecycleState((current) =>
            setRouteLiveMapState(current, "error"),
          );
        });
      } catch {
        /* v8 ignore next */
        if (!disposed) {
          setLiveMapLifecycleState((current) =>
            setRouteLiveMapState(current, "error"),
          );
        }
      }
    }

    void mountLiveMap();

    return () => {
      disposed = true;
      cleanupLiveMap(liveMapContainer);
    };
  }, [
    cleanupLiveMap,
    fallbackViewport.center,
    fallbackViewport.zoom,
    liveMapAvailability,
    liveMapEnabled,
    liveRoutePointsRef,
    mapContainerRef,
    maplibreModuleRef,
    mapRef,
    retryKey,
    setLiveMapLifecycleState,
  ]);
}
