import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RouteViewport } from "./route-map.config";
import {
  applyRouteMapTheme,
  cleanupLiveRouteMap,
  fitLiveRoute,
  removeMapChromeFromTabOrder,
  synchronizeRouteLayers,
} from "./route-map.live";
import {
  type LiveRouteMarkerRegistry,
  synchronizeLiveRouteMarkers,
} from "./route-map.live-markers";
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
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const maplibreModuleRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markersRef = useRef<LiveRouteMarkerRegistry>(new Map());
  const sourceIdsRef = useRef<string[]>([]);
  const liveRoutePointsRef = useRef(liveRoutePoints);
  const liveMapState =
    liveMapAvailability === "auto"
      ? liveMapLifecycleState.state
      : liveMapAvailability;

  const markerItems = useMemo(() => new Set(liveRoutePoints.map((point) => point.item.id)), [liveRoutePoints]);

  useEffect(() => {
    liveRoutePointsRef.current = liveRoutePoints;
  }, [liveRoutePoints]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !liveMapEnabled || liveMapAvailability !== "auto") return undefined;

    let disposed = false;
    const liveMapContainer = mapContainerRef.current;
    const mountedMarkers = markersRef.current;

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
      const cleaned = cleanupLiveRouteMap({
        container: liveMapContainer,
        map: mapRef.current,
        markers: mountedMarkers,
        sourceIds: sourceIdsRef.current,
      });
      sourceIdsRef.current = cleaned.sourceIds;
      mapRef.current = cleaned.map;
    };
  }, [
    fallbackViewport.center,
    fallbackViewport.zoom,
    liveMapAvailability,
    liveMapEnabled,
    liveMapLifecycleState.retryKey,
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
  }, [activeDay, fallbackViewport, liveMapState, liveRoutePoints, visibleLiveRoutePoints, routeDayGroups, markerItems]);

  const retryLiveMap = useCallback(() => {
    const cleaned = cleanupLiveRouteMap({
      container: mapContainerRef.current,
      map: mapRef.current,
      markers: markersRef.current,
      sourceIds: sourceIdsRef.current,
    });
    sourceIdsRef.current = cleaned.sourceIds;
    mapRef.current = cleaned.map;
    setLiveMapLifecycleState((current) => retryRouteLiveMap(current));
  }, []);

  return {
    liveMapState,
    mapContainerRef,
    retryLiveMap,
  };
}
