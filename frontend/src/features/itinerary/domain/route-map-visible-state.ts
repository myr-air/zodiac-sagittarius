import type { ItineraryItem } from "@/src/trip/types";
import {
  allDaysFilter,
  type DayFilter,
  type RouteDayGroup,
  type RoutePoint,
  type VisibleRouteMapState,
} from "./route-map-types";

interface VisibleRouteMapStateInput {
  activeDay: DayFilter;
  coordinateRoutePoints: RoutePoint[];
  liveRoutePoints: RoutePoint[];
  maxAllDaysCoordinateResolutionBatch: number;
  routeDayGroups: RouteDayGroup[];
  unresolvedItems: ItineraryItem[];
}

export function buildVisibleRouteMapState({
  activeDay,
  coordinateRoutePoints,
  liveRoutePoints,
  maxAllDaysCoordinateResolutionBatch,
  routeDayGroups,
  unresolvedItems,
}: VisibleRouteMapStateInput): VisibleRouteMapState {
  const isAllDays = activeDay === allDaysFilter;
  const visibleRouteDayGroups = isAllDays
    ? routeDayGroups
    : routeDayGroups.filter((group) => group.day === activeDay);
  const visibleRoutePoints = visibleRoutePointsForDay(
    coordinateRoutePoints,
    activeDay,
  );
  const visibleUnresolvedItems = isAllDays
    ? unresolvedItems
    : unresolvedItems.filter((item) => item.day === activeDay);

  return {
    coordinateResolutionBatch: isAllDays
      ? visibleUnresolvedItems.slice(0, maxAllDaysCoordinateResolutionBatch)
      : visibleUnresolvedItems,
    visibleLiveRoutePoints: visibleRoutePointsForDay(liveRoutePoints, activeDay),
    visibleRouteDayGroups,
    visibleRoutePoints,
    visibleUnresolvedItems,
  };
}

function visibleRoutePointsForDay(
  points: RoutePoint[],
  activeDay: DayFilter,
): RoutePoint[] {
  return activeDay === allDaysFilter
    ? points
    : points.filter((point) => point.item.day === activeDay);
}
