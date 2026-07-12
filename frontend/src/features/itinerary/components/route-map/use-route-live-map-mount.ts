import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";
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
  const tileLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

        const rect = container.getBoundingClientRect();
        console.log(
          "[useRouteLiveMap Mount] container dimensions:",
          `${Math.round(rect.width)}×${Math.round(rect.height)}`,
        );

        map.on("sourcedata", (event: {
          isSourceLoaded: boolean;
          sourceId: string;
          source?: { type: string };
        }) => {
          if (disposed) return;
          console.log(
            "[useRouteLiveMap Mount] sourcedata:",
            event.sourceId,
            "isSourceLoaded:",
            event.isSourceLoaded,
            "source type:",
            event.source?.type,
          );
          if (
            event.isSourceLoaded &&
            event.sourceId &&
            event.source?.type !== "geojson"
          ) {
            if (tileLoadTimerRef.current) {
              clearTimeout(tileLoadTimerRef.current);
              tileLoadTimerRef.current = null;
              console.log(
                "[useRouteLiveMap Mount] tile source loaded, timeout cleared",
              );
            }
          }
        });

        map.on("styleimagemissing", (event: { id: string }) => {
          if (disposed) return;
          console.log(
            "[useRouteLiveMap Mount] style image missing:",
            event.id,
          );
        });

        map.on("load", () => {
          if (disposed) return;
          applyRouteMapTheme(map);
          container.inert = false;
          setLiveMapLifecycleState((current) =>
            setRouteLiveMapState(current, "ready"),
          );
          console.log(
            "[useRouteLiveMap Mount] map load fired, starting tile-load timeout (4s)",
          );
          tileLoadTimerRef.current = setTimeout(() => {
            if (disposed) return;
            console.log(
              "[useRouteLiveMap Mount] tile-load timeout expired, transitioning to error",
            );
            setLiveMapLifecycleState((current) =>
              setRouteLiveMapState(current, "error"),
            );
          }, 4000);
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
      if (tileLoadTimerRef.current) {
        clearTimeout(tileLoadTimerRef.current);
        tileLoadTimerRef.current = null;
      }
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
