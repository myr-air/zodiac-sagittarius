import { useEffect, useMemo } from "react";
import type { RouteViewport } from "./route-map.config";
import { fitLiveRoute } from "./route-map.live";
import { synchronizeRouteLayers } from "./route-map.live-layers";
import { synchronizeLiveRouteMarkers } from "./route-map.live-markers";
import type {
  DayFilter,
  RouteDayGroup,
  RoutePoint,
} from "./route-map.types";
import type { useRouteLiveMapRefs } from "./use-route-live-map-refs";

type RouteLiveMapRefs = ReturnType<typeof useRouteLiveMapRefs>;

interface UseRouteLiveMapSyncInput {
  activeDay: DayFilter;
  fallbackViewport: RouteViewport;
  liveMapState: "idle" | "loading" | "ready" | "error";
  liveRoutePoints: RoutePoint[];
  maplibreModuleRef: RouteLiveMapRefs["maplibreModuleRef"];
  mapRef: RouteLiveMapRefs["mapRef"];
  markersRef: RouteLiveMapRefs["markersRef"];
  routeDayGroups: RouteDayGroup[];
  sourceIdsRef: RouteLiveMapRefs["sourceIdsRef"];
  visibleLiveRoutePoints: RoutePoint[];
}

export function useRouteLiveMapSync({
  activeDay,
  fallbackViewport,
  liveMapState,
  liveRoutePoints,
  maplibreModuleRef,
  mapRef,
  markersRef,
  routeDayGroups,
  sourceIdsRef,
  visibleLiveRoutePoints,
}: UseRouteLiveMapSyncInput) {
  const markerItems = useMemo(
    () => new Set(liveRoutePoints.map((point) => point.item.id)),
    [liveRoutePoints],
  );

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

    sourceIdsRef.current = synchronizeRouteLayers(
      map,
      sourceIdsRef.current,
      routeDayGroups,
      activeDay,
    );
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
}
