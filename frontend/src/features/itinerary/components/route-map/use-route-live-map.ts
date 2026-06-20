import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RouteViewport } from "./route-map.config";
import {
  applyRouteMapTheme,
  cleanupRouteLayers,
  fitLiveRoute,
  removeMapChromeFromTabOrder,
  synchronizeRouteLayers,
} from "./route-map.live";
import {
  type LiveRouteMarkerRegistry,
  synchronizeLiveRouteMarkers,
} from "./route-map.live-markers";
import type { DayFilter, RouteDayGroup, RoutePoint } from "./route-map.types";
import { getRouteCenter } from "./route-map.utils";

export type RouteLiveMapState = "idle" | "loading" | "ready" | "error";

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
  const [autoLiveMapState, setAutoLiveMapState] = useState<RouteLiveMapState>("idle");
  const [liveMapRetryKey, setLiveMapRetryKey] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const maplibreModuleRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markersRef = useRef<LiveRouteMarkerRegistry>(new Map());
  const sourceIdsRef = useRef<string[]>([]);
  const liveRoutePointsRef = useRef(liveRoutePoints);
  const liveMapState = liveMapAvailability === "auto" ? autoLiveMapState : liveMapAvailability;

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
      setAutoLiveMapState("loading");

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
          setAutoLiveMapState("ready");
        });

        map.on("error", () => {
          if (disposed) return;
          setAutoLiveMapState("error");
        });
      } catch {
        /* v8 ignore next */
        if (!disposed) setAutoLiveMapState("error");
      }
    }

    void mountLiveMap();

    return () => {
      disposed = true;
      const map = mapRef.current;
      mountedMarkers.forEach((entry) => entry.marker.remove());
      mountedMarkers.clear();
      if (map) cleanupRouteLayers(map, sourceIdsRef.current);
      sourceIdsRef.current = [];
      map?.remove();
      mapRef.current = null;
      if (liveMapContainer) {
        liveMapContainer.inert = false;
      }
    };
  }, [fallbackViewport.center, fallbackViewport.zoom, liveMapAvailability, liveMapEnabled, liveMapRetryKey]);

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
    markersRef.current.forEach((entry) => entry.marker.remove());
    markersRef.current.clear();
    if (mapRef.current) {
      cleanupRouteLayers(mapRef.current, sourceIdsRef.current);
      mapRef.current.remove();
    }
    sourceIdsRef.current = [];
    mapRef.current = null;
    if (mapContainerRef.current) {
      mapContainerRef.current.inert = false;
    }
    setAutoLiveMapState("idle");
    setLiveMapRetryKey((key) => key + 1);
  }, []);

  return {
    liveMapState,
    mapContainerRef,
    retryLiveMap,
  };
}
