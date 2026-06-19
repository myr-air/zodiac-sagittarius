import { useMemo, useState } from "react";
import type { ItineraryItem } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { groupItemsByDay, type ItineraryView } from "@/src/trip/itinerary";
import { Icon } from "@/src/ui/icons";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import {
  mapSourceNoteClassName,
  routeLiveMapClassName,
  routeLiveMapPendingClassName,
  routeMapCanvasClassName,
  routeMapLayoutClassName,
  routeMapPanelClassName,
  routeMapRetryButtonClassName,
  routeMapStatusClassName,
  maxAllDaysCoordinateResolutionBatch,
} from "./route-map.config";
import {
  activeDayLabel,
  buildRouteDayGroups,
  buildRoutePoints,
  fallbackRouteViewport,
  hasCoordinates,
} from "./route-map.utils";
import type { DayFilter, MapCoordinateResolutionResult } from "./route-map.types";
import { RouteMapDayFilter } from "./RouteMapDayFilter";
import { RouteMapUnresolvedPanel } from "./RouteMapUnresolvedPanel";
import { StaticRouteFallback } from "./StaticRouteFallback";
import { useRouteLiveMap } from "./use-route-live-map";

interface RouteMapViewProps {
  countries?: string[];
  destinationLabel?: string;
  endDate: string;
  items: ItineraryItem[];
  itineraryView?: ItineraryView;
  liveMapAvailability?: "auto" | "loading" | "error";
  liveMapEnabled?: boolean;
  onResolveMissingCoordinates?: (items: ItineraryItem[]) => Promise<MapCoordinateResolutionResult | void> | MapCoordinateResolutionResult | void;
  startDate: string;
  tripName: string;
}

export function RouteMapView({
  countries = [],
  destinationLabel = "",
  endDate,
  itineraryView,
  items,
  liveMapAvailability = "auto",
  liveMapEnabled = process.env.NODE_ENV !== "test",
  onResolveMissingCoordinates,
  startDate,
  tripName,
}: RouteMapViewProps) {
  const { locale, t } = useI18n();
  const groups = useMemo(() => itineraryView?.dayGroups ?? groupItemsByDay(items), [items, itineraryView]);
  const routePoints = useMemo(() => buildRoutePoints(items), [items]);
  const coordinateRoutePoints = useMemo(() => routePoints.filter((point) => hasCoordinates(point.item.coordinates)), [routePoints]);
  const unresolvedItems = useMemo(() => items.filter((item) => !hasCoordinates(item.coordinates)), [items]);
  const routeDayGroups = useMemo(() => buildRouteDayGroups(groups, coordinateRoutePoints, startDate, locale), [coordinateRoutePoints, groups, locale, startDate]);
  const [activeDay, setActiveDay] = useState<DayFilter>("all");
  const visibleRouteDayGroups = useMemo(
    () => routeDayGroups.filter((group) => activeDay === "all" || group.day === activeDay),
    [activeDay, routeDayGroups],
  );
  const visibleRoutePoints = useMemo(
    () => (activeDay === "all" ? coordinateRoutePoints : coordinateRoutePoints.filter((point) => point.item.day === activeDay)),
    [activeDay, coordinateRoutePoints],
  );
  const visibleUnresolvedItems = useMemo(
    () => (activeDay === "all" ? unresolvedItems : unresolvedItems.filter((item) => item.day === activeDay)),
    [activeDay, unresolvedItems],
  );
  const coordinateResolutionBatch = useMemo(
    () => (
      activeDay === "all"
        ? visibleUnresolvedItems.slice(0, maxAllDaysCoordinateResolutionBatch)
        : visibleUnresolvedItems
    ),
    [activeDay, visibleUnresolvedItems],
  );
  const liveRoutePoints = coordinateRoutePoints;
  const visibleLiveRoutePoints = useMemo(
    () => (activeDay === "all" ? liveRoutePoints : liveRoutePoints.filter((point) => point.item.day === activeDay)),
    [activeDay, liveRoutePoints],
  );
  const fallbackViewport = useMemo(() => fallbackRouteViewport(destinationLabel, countries), [countries, destinationLabel]);
  const warningCount = itineraryView?.warningCount ?? items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const [resolvingMissing, setResolvingMissing] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<MapCoordinateResolutionResult | null>(null);
  const {
    liveMapState,
    mapContainerRef,
    retryLiveMap,
  } = useRouteLiveMap({
    activeDay,
    fallbackViewport,
    liveMapAvailability,
    liveMapEnabled,
    liveRoutePoints,
    routeDayGroups,
    visibleLiveRoutePoints,
  });

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

  return (
    <section className={routeMapPanelClassName} id="map" aria-labelledby="route-map-heading" aria-label={t.map.pageLabel}>
      <PageHeader
        title={t.map.title}
        subtitle={tripName}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(startDate, endDate, locale)}</span>
            <span><Icon name="location" /> {t.map.locationStatus({ mapped: visibleRoutePoints.length, total: items.length, unresolved: visibleUnresolvedItems.length })}</span>
            <span><Icon name="warning" /> {t.dates.warningCount({ count: warningCount })}</span>
            <span><Icon name="route" /> {activeDayLabel(activeDay, routeDayGroups, t.map.allDays, t.map.chooseDay)}</span>
          </>
        )}
        motif={<TravelMotif tone="route" />}
      />

      <div className={routeMapLayoutClassName}>
        <div className={routeMapCanvasClassName} data-live-map-state={liveMapState} aria-label={t.map.canvasLabel}>
          <RouteMapDayFilter
            activeDay={activeDay}
            allDaysLabel={t.map.allDays}
            filterLabel={t.map.filterLabel}
            routeDayGroups={routeDayGroups}
            onChange={setActiveDay}
          />

          {liveMapState !== "ready" ? (
            <StaticRouteFallback
              routeDayGroups={visibleRouteDayGroups}
              routePoints={visibleRoutePoints}
              stopListLabel={t.map.visibleStopsLabel}
            />
          ) : null}

          {liveMapState !== "error" ? (
            <>
              <div className={cn(routeLiveMapClassName, liveMapState !== "ready" && routeLiveMapPendingClassName)} ref={mapContainerRef} aria-hidden="true" />
              {liveMapState !== "ready" ? <p className={routeMapStatusClassName}>{liveMapStatusText(liveMapState, t.map.liveLoading, t.map.liveError)}</p> : null}
            </>
          ) : (
            <>
              <div className={routeMapStatusClassName} role="status">
                <p className="m-0">{liveMapStatusText(liveMapState, t.map.liveLoading, t.map.liveError)}</p>
                {liveMapEnabled && liveMapAvailability === "auto" ? (
                  <button className={routeMapRetryButtonClassName} type="button" onClick={retryLiveMap}>
                    <Icon name="redo" />
                    {t.map.retryLiveMap}
                  </button>
                ) : null}
              </div>
            </>
          )}
          {visibleUnresolvedItems.length > 0 ? (
            <RouteMapUnresolvedPanel
              activeDay={activeDay}
              coordinateResolutionBatch={coordinateResolutionBatch}
              copy={{
                label: t.map.unresolvedLabel,
                resolveBatchHint: t.map.resolveBatchHint,
                resolveMissing: t.map.resolveMissing,
                resolveProgress: t.map.resolveProgress,
                resolveResult: t.map.resolveResult,
                resolveUnavailable: t.map.resolveUnavailable,
                resolvingMissing: t.map.resolvingMissing,
                title: t.map.unresolvedTitle,
              }}
              onResolveMissingCoordinates={onResolveMissingCoordinates ? handleResolveMissingCoordinates : undefined}
              resolutionResult={resolutionResult}
              resolvingMissing={resolvingMissing}
              visibleUnresolvedItems={visibleUnresolvedItems}
            />
          ) : null}
          {liveMapState === "error" || !liveMapEnabled ? <p className={mapSourceNoteClassName}>{t.map.sourceNote}</p> : null}
        </div>
      </div>
    </section>
  );
}

export function liveMapStatusText(state: "idle" | "loading" | "ready" | "error", loadingLabel = "Loading map from OpenFreeMap", errorLabel = "Could not load the live map. Showing the fallback route diagram."): string {
  if (state === "error") return errorLabel;
  return loadingLabel;
}

export {
  activeDayLabel,
  dayColorFor,
  fallbackRouteViewport,
  getRouteCenter,
} from "./route-map.utils";
export {
  applyRouteMapTheme,
  fitLiveRoute,
} from "./route-map.live";
