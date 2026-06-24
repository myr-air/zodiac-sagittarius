import { useCallback, useEffect, useRef } from "react";
import { cleanupLiveRouteMap } from "./route-map.live";
import type { LiveRouteMarkerRegistry } from "./route-map.live-markers";
import type { RoutePoint } from "./route-map.types";

export function useRouteLiveMapRefs(liveRoutePoints: RoutePoint[]) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const maplibreModuleRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markersRef = useRef<LiveRouteMarkerRegistry>(new Map());
  const sourceIdsRef = useRef<string[]>([]);
  const liveRoutePointsRef = useRef(liveRoutePoints);

  useEffect(() => {
    liveRoutePointsRef.current = liveRoutePoints;
  }, [liveRoutePoints]);

  const cleanupLiveMap = useCallback((container = mapContainerRef.current) => {
    const cleaned = cleanupLiveRouteMap({
      container,
      map: mapRef.current,
      markers: markersRef.current,
      sourceIds: sourceIdsRef.current,
    });
    sourceIdsRef.current = cleaned.sourceIds;
    mapRef.current = cleaned.map;
  }, []);

  return {
    cleanupLiveMap,
    liveRoutePointsRef,
    mapContainerRef,
    maplibreModuleRef,
    mapRef,
    markersRef,
    sourceIdsRef,
  };
}
