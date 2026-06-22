import { useCallback, useEffect, useMemo, useState } from "react";
import type { RouteViewport } from "./route-map.config";
import {
  applyRouteMapTheme,
  fitLiveRoute,
  removeMapChromeFromTabOrder,
  synchronizeRouteLayers,
} from "./route-map.live";
import { synchronizeLiveRouteMarkers } from "./route-map.live-markers";
import {
  initialRouteLiveMapLifecycleState,
  retryRouteLiveMap,
  setRouteLiveMapState,
} from "./route-live-map-state";
import type {
  DayFilter,
  RouteDayGroup,
  RoutePoint,
} from "./route-map.types";
import { getRouteCenter } from "./route-map.viewport";
import { useRouteLiveMapRefs } from "./use-route-live-map-refs";

interface UseRouteLiveMapInput {
  activeDay: DayFilter;
  fallbackViewport: RouteViewport;
  liveMapAvailability: "auto" | "loading" | "error";
  liveMapEnabled: boolean;
  liveRoutePoints: RoutePoint[];
  routeDayGroups: RouteDayGroup[];
  visibleLiveRoutePoints: RoutePoint[];
}

export function useRouteLiveMap({
  activeDay,
  fallbackViewport,
  liveMapAvailability,
  liveMapEnabled,
  liveRoutePoints,
  routeDayGroups,
  visibleLiveRoutePoints,
}: UseRouteLiveMapInput) {
  const [liveMapLifecycleState, setLiveMapLifecycleState] = useState(
    initialRouteLiveMapLifecycleState,
  );
  const {
    cleanupLiveMap,
    liveRoutePointsRef,
    mapContainerRef,
    maplibreModuleRef,
    mapRef,
    markersRef,
    sourceIdsRef,
  } = useRouteLiveMapRefs(liveRoutePoints);
  const liveMapState =
    liveMapAvailability === "auto"
      ? liveMapLifecycleState.state
      : liveMapAvailability;

  const markerItems = useMemo(() => new Set(liveRoutePoints.map((point) => point.item.id)), [liveRoutePoints]);

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
    liveMapLifecycleState.retryKey,
    liveRoutePointsRef,
    mapContainerRef,
    maplibreModuleRef,
    mapRef,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreModuleRef.current;
    if (!map || liveMapState !== "ready" || !maplibregl) return;

    synchronizeLiveRouteMarkers({
      activeDay,
      liveRoutePoints,
      map,
      maplibregl,
      markerItems,
      markers: markersRef.current,
      routeDayGroups,
      visibleLiveRoutePoints,
    });

    sourceIdsRef.current = synchronizeRouteLayers(map, sourceIdsRef.current, routeDayGroups, activeDay);
    fitLiveRoute(map, visibleLiveRoutePoints, fallbackViewport);
  }, [
    activeDay,
    fallbackViewport,
    liveMapState,
    liveRoutePoints,
    maplibreModuleRef,
    mapRef,
    markerItems,
    markersRef,
    routeDayGroups,
    sourceIdsRef,
    visibleLiveRoutePoints,
  ]);

  const retryLiveMap = useCallback(() => {
    cleanupLiveMap();
    setLiveMapLifecycleState((current) => retryRouteLiveMap(current));
  }, [cleanupLiveMap]);

  return {
    liveMapState,
    mapContainerRef,
    retryLiveMap,
  };
}
