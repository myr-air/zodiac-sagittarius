import { useCallback, useState } from "react";
import type { RouteViewport } from "./route-map.config";
import {
  initialRouteLiveMapLifecycleState,
  retryRouteLiveMap,
} from "./route-live-map-state";
import type {
  DayFilter,
  RouteDayGroup,
  RoutePoint,
} from "./route-map.types";
import { useRouteLiveMapMount } from "./use-route-live-map-mount";
import { useRouteLiveMapRefs } from "./use-route-live-map-refs";
import { useRouteLiveMapSync } from "./use-route-live-map-sync";

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

  useRouteLiveMapMount({
    cleanupLiveMap,
    fallbackViewport,
    liveMapAvailability,
    liveMapEnabled,
    liveRoutePointsRef,
    mapContainerRef,
    maplibreModuleRef,
    mapRef,
    retryKey: liveMapLifecycleState.retryKey,
    setLiveMapLifecycleState,
  });

  useRouteLiveMapSync({
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
  });

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
