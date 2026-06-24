import type { MapCoordinateResolutionResult } from "@/src/trip/places";
import { allDaysFilter, type DayFilter } from "./route-map.types";
import {
  beginRouteMapCoordinateResolution,
  completeRouteMapCoordinateResolution,
  initialRouteMapResolutionState,
  type RouteMapResolutionState,
} from "./route-map-resolution-state";

export interface RouteMapViewState {
  activeDay: DayFilter;
  resolutionState: RouteMapResolutionState;
}

export const initialRouteMapViewState: RouteMapViewState = {
  activeDay: allDaysFilter,
  resolutionState: initialRouteMapResolutionState,
};

export function setRouteMapActiveDay(
  state: RouteMapViewState,
  activeDay: DayFilter,
): RouteMapViewState {
  return {
    ...state,
    activeDay,
  };
}

export function beginRouteMapViewCoordinateResolution(
  state: RouteMapViewState,
): RouteMapViewState {
  return {
    ...state,
    resolutionState: beginRouteMapCoordinateResolution(),
  };
}

export function completeRouteMapViewCoordinateResolution(
  state: RouteMapViewState,
  result?: MapCoordinateResolutionResult | void,
): RouteMapViewState {
  return {
    ...state,
    resolutionState: completeRouteMapCoordinateResolution(result),
  };
}

export function settleRouteMapViewCoordinateResolution(
  state: RouteMapViewState,
): RouteMapViewState {
  return state.resolutionState.resolvingMissing
    ? completeRouteMapViewCoordinateResolution(
        state,
        state.resolutionState.resolutionResult ?? undefined,
      )
    : state;
}
