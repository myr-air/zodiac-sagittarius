import type { MapCoordinateResolutionResult } from "@/src/trip/places";

export interface RouteMapResolutionState {
  resolutionResult: MapCoordinateResolutionResult | null;
  resolvingMissing: boolean;
}

export const initialRouteMapResolutionState: RouteMapResolutionState = {
  resolutionResult: null,
  resolvingMissing: false,
};

export function beginRouteMapCoordinateResolution(): RouteMapResolutionState {
  return {
    resolutionResult: null,
    resolvingMissing: true,
  };
}

export function completeRouteMapCoordinateResolution(
  result: MapCoordinateResolutionResult | void,
): RouteMapResolutionState {
  return {
    resolutionResult: result ?? null,
    resolvingMissing: false,
  };
}
