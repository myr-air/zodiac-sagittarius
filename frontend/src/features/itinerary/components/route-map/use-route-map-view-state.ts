import { useMemo, useState } from "react";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem } from "@/src/trip/types";
import { groupItemsByDay, type ItineraryView } from "@/src/trip/itinerary-core";
import type { MapCoordinateResolutionResult } from "@/src/trip/places";
import {
  maxAllDaysCoordinateResolutionBatch,
} from "./route-map.config";
import {
  beginRouteMapViewCoordinateResolution,
  completeRouteMapViewCoordinateResolution,
  initialRouteMapViewState,
  setRouteMapActiveDay,
  settleRouteMapViewCoordinateResolution,
} from "./route-map-view-state";
import {
  buildRouteDayGroups,
  buildRoutePoints,
  buildVisibleRouteMapState,
  hasCoordinates,
} from "@/src/features/itinerary/domain/route-map-model";
import type { DayFilter } from "./route-map.types";

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
  const [viewState, setViewState] = useState(initialRouteMapViewState);
  const liveRoutePoints = coordinateRoutePoints;
  const {
    coordinateResolutionBatch,
    visibleLiveRoutePoints,
    visibleRouteDayGroups,
    visibleRoutePoints,
    visibleUnresolvedItems,
  } = useMemo(() => buildVisibleRouteMapState({
    activeDay: viewState.activeDay,
    coordinateRoutePoints,
    liveRoutePoints,
    maxAllDaysCoordinateResolutionBatch,
    routeDayGroups,
    unresolvedItems,
  }), [viewState.activeDay, coordinateRoutePoints, liveRoutePoints, routeDayGroups, unresolvedItems]);
  const warningCount = itineraryView?.warningCount ?? items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);

  async function handleResolveMissingCoordinates() {
    if (!onResolveMissingCoordinates || coordinateResolutionBatch.length === 0) return;
    setViewState((current) => beginRouteMapViewCoordinateResolution(current));
    try {
      const result = await onResolveMissingCoordinates(coordinateResolutionBatch);
      setViewState((current) =>
        completeRouteMapViewCoordinateResolution(current, result),
      );
    } finally {
      setViewState((current) => settleRouteMapViewCoordinateResolution(current));
    }
  }

  return {
    activeDay: viewState.activeDay,
    coordinateResolutionBatch,
    handleResolveMissingCoordinates,
    liveRoutePoints,
    resolutionResult: viewState.resolutionState.resolutionResult,
    resolvingMissing: viewState.resolutionState.resolvingMissing,
    routeDayGroups,
    setActiveDay: (activeDay: DayFilter) =>
      setViewState((current) => setRouteMapActiveDay(current, activeDay)),
    visibleLiveRoutePoints,
    visibleRouteDayGroups,
    visibleRoutePoints,
    visibleUnresolvedItems,
    warningCount,
  };
}
