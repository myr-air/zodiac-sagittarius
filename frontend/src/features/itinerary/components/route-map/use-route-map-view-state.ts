import { useMemo, useState } from "react";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem } from "@/src/trip/types";
import { groupItemsByDay, type ItineraryView } from "@/src/trip/itinerary-core";
import {
  maxAllDaysCoordinateResolutionBatch,
} from "./route-map.config";
import {
  buildRouteDayGroups,
  buildRoutePoints,
  hasCoordinates,
} from "./route-map.utils";
import { allDaysFilter, type DayFilter, type MapCoordinateResolutionResult } from "./route-map.types";

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
  const visibleRouteDayGroups = useMemo(
    () => routeDayGroups.filter((group) => activeDay === allDaysFilter || group.day === activeDay),
    [activeDay, routeDayGroups],
  );
  const visibleRoutePoints = useMemo(
    () => (activeDay === allDaysFilter ? coordinateRoutePoints : coordinateRoutePoints.filter((point) => point.item.day === activeDay)),
    [activeDay, coordinateRoutePoints],
  );
  const visibleUnresolvedItems = useMemo(
    () => (activeDay === allDaysFilter ? unresolvedItems : unresolvedItems.filter((item) => item.day === activeDay)),
    [activeDay, unresolvedItems],
  );
  const coordinateResolutionBatch = useMemo(
    () => (
      activeDay === allDaysFilter
        ? visibleUnresolvedItems.slice(0, maxAllDaysCoordinateResolutionBatch)
        : visibleUnresolvedItems
    ),
    [activeDay, visibleUnresolvedItems],
  );
  const liveRoutePoints = coordinateRoutePoints;
  const visibleLiveRoutePoints = useMemo(
    () => (activeDay === allDaysFilter ? liveRoutePoints : liveRoutePoints.filter((point) => point.item.day === activeDay)),
    [activeDay, liveRoutePoints],
  );
  const warningCount = itineraryView?.warningCount ?? items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const [resolvingMissing, setResolvingMissing] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<MapCoordinateResolutionResult | null>(null);

  async function handleResolveMissingCoordinates() {
    if (!onResolveMissingCoordinates || coordinateResolutionBatch.length === 0) return;
    setResolvingMissing(true);
    setResolutionResult(null);
    try {
      const result = await onResolveMissingCoordinates(coordinateResolutionBatch);
      setResolutionResult(result ?? null);
    } finally {
      setResolvingMissing(false);
    }
  }

  return {
    activeDay,
    coordinateResolutionBatch,
    handleResolveMissingCoordinates,
    liveRoutePoints,
    resolutionResult,
    resolvingMissing,
    routeDayGroups,
    setActiveDay,
    visibleLiveRoutePoints,
    visibleRouteDayGroups,
    visibleRoutePoints,
    visibleUnresolvedItems,
    warningCount,
  };
}
