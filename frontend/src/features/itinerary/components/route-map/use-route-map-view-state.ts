import { useMemo, useState } from "react";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem } from "@/src/trip/types";
import { groupItemsByDay, type ItineraryView } from "@/src/trip/itinerary-core";
import type { MapCoordinateResolutionResult } from "@/src/trip/places";
import {
  maxAllDaysCoordinateResolutionBatch,
} from "./route-map.config";
import {
  beginRouteMapCoordinateResolution,
  completeRouteMapCoordinateResolution,
  initialRouteMapResolutionState,
} from "./route-map-resolution-state";
import {
  buildRouteDayGroups,
  buildRoutePoints,
  buildVisibleRouteMapState,
  hasCoordinates,
} from "@/src/features/itinerary/domain/route-map-model";
import { allDaysFilter, type DayFilter } from "./route-map.types";

interface UseRouteMapViewStateInput {
  items: ItineraryItem[];
  itineraryView?: ItineraryView;
  locale: Locale;
  onResolveMissingCoordinates?: (items: ItineraryItem[]) => Promise<MapCoordinateResolutionResult | void> | MapCoordinateResolutionResult | void;
  startDate: string;
}

export function useRouteMapViewState({
  items,
  itineraryView,
  locale,
  onResolveMissingCoordinates,
  startDate,
}: UseRouteMapViewStateInput) {
  const groups = useMemo(() => itineraryView?.dayGroups ?? groupItemsByDay(items), [items, itineraryView]);
  const routePoints = useMemo(() => buildRoutePoints(items), [items]);
  const coordinateRoutePoints = useMemo(() => routePoints.filter((point) => hasCoordinates(point.item.coordinates)), [routePoints]);
  const unresolvedItems = useMemo(() => items.filter((item) => !hasCoordinates(item.coordinates)), [items]);
  const routeDayGroups = useMemo(() => buildRouteDayGroups(groups, coordinateRoutePoints, startDate, locale), [coordinateRoutePoints, groups, locale, startDate]);
  const [activeDay, setActiveDay] = useState<DayFilter>(allDaysFilter);
  const liveRoutePoints = coordinateRoutePoints;
  const {
    coordinateResolutionBatch,
    visibleLiveRoutePoints,
    visibleRouteDayGroups,
    visibleRoutePoints,
    visibleUnresolvedItems,
  } = useMemo(() => buildVisibleRouteMapState({
    activeDay,
    coordinateRoutePoints,
    liveRoutePoints,
    maxAllDaysCoordinateResolutionBatch,
    routeDayGroups,
    unresolvedItems,
  }), [activeDay, coordinateRoutePoints, liveRoutePoints, routeDayGroups, unresolvedItems]);
  const warningCount = itineraryView?.warningCount ?? items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const [resolutionState, setResolutionState] = useState(
    initialRouteMapResolutionState,
  );

  async function handleResolveMissingCoordinates() {
    if (!onResolveMissingCoordinates || coordinateResolutionBatch.length === 0) return;
    setResolutionState(beginRouteMapCoordinateResolution());
    try {
      const result = await onResolveMissingCoordinates(coordinateResolutionBatch);
      setResolutionState(completeRouteMapCoordinateResolution(result));
    } finally {
      setResolutionState((current) =>
        current.resolvingMissing
          ? completeRouteMapCoordinateResolution(current.resolutionResult ?? undefined)
          : current,
      );
    }
  }

  return {
    activeDay,
    coordinateResolutionBatch,
    handleResolveMissingCoordinates,
    liveRoutePoints,
    resolutionResult: resolutionState.resolutionResult,
    resolvingMissing: resolutionState.resolvingMissing,
    routeDayGroups,
    setActiveDay,
    visibleLiveRoutePoints,
    visibleRouteDayGroups,
    visibleRoutePoints,
    visibleUnresolvedItems,
    warningCount,
  };
}
