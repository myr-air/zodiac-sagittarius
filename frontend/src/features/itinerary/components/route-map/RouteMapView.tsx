import { useEffect, useMemo, useRef, useState } from "react";
import type { ItineraryItem } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { groupItemsByDay, type ItineraryView } from "@/src/trip/itinerary";
import { Icon } from "@/src/ui/icons";
import { TravelMotif } from "@/src/components/motifs";
import { formatTripRange, PageHeader } from "@/src/components/PageHeader";
import {
  mapSourceNoteClassName,
  routeLiveMapClassName,
  routeLiveMapPendingClassName,
  routeMapCanvasClassName,
  routeMapLayoutClassName,
  routeMapPanelClassName,
  routeMapRetryButtonClassName,
  routeMapStatusClassName,
  unresolvedPanelActionsClassName,
  unresolvedPanelButtonClassName,
  unresolvedPanelClassName,
  unresolvedPanelHeaderClassName,
  unresolvedPanelItemClassName,
  unresolvedPanelItemTitleClassName,
  unresolvedPanelListClassName,
  unresolvedPanelStatusClassName,
  maxAllDaysCoordinateResolutionBatch,
} from "./route-map.config";
import {
  activeDayLabel,
  applyRouteMapTheme,
  buildRouteDayGroups,
  buildRoutePoints,
  cleanupRouteLayers,
  dayColorFor,
  fallbackRouteViewport,
  fitLiveRoute,
  getRouteCenter,
  hasCoordinates,
  removeMapChromeFromTabOrder,
  synchronizeRouteLayers,
  type DayFilter,
} from "./route-map.utils";
import { RouteMapDayFilter } from "./RouteMapDayFilter";
import { StaticRouteFallback } from "./StaticRouteFallback";

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

export interface MapCoordinateResolutionResult {
  attempted: number;
  failed: number;
  resolved: number;
  skipped: number;
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
  const [autoLiveMapState, setAutoLiveMapState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [resolvingMissing, setResolvingMissing] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<MapCoordinateResolutionResult | null>(null);
  const liveMapState = liveMapAvailability === "auto" ? autoLiveMapState : liveMapAvailability;
  const [liveMapRetryKey, setLiveMapRetryKey] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const maplibreModuleRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markersRef = useRef<Map<string, { marker: import("maplibre-gl").Marker; day: string }>>(new Map());
  const sourceIdsRef = useRef<string[]>([]);
  const liveRoutePointsRef = useRef(liveRoutePoints);

  const markerItems = useMemo(() => new Set(liveRoutePoints.map((point) => point.item.id)), [liveRoutePoints]);

  useEffect(() => {
    liveRoutePointsRef.current = liveRoutePoints;
  }, [liveRoutePoints]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !liveMapEnabled || liveMapAvailability !== "auto") return undefined;

    let disposed = false;
    const liveMapContainer = mapContainerRef.current;
    const mountedMarkers = markersRef.current;

    async function mountLiveMap() {
      setAutoLiveMapState("loading");

      try {
        const maplibregl = await import("maplibre-gl");
        if (!mapContainerRef.current || disposed) return;
        maplibreModuleRef.current = maplibregl;
        const container = mapContainerRef.current;
        container.inert = true;

        const map = new maplibregl.Map({
          attributionControl: { compact: true },
          center: getRouteCenter(liveRoutePointsRef.current, fallbackViewport.center),
          container,
          cooperativeGestures: true,
          style: "https://tiles.openfreemap.org/styles/positron",
          zoom: liveRoutePointsRef.current.length > 0 ? 10 : fallbackViewport.zoom,
        });

        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        removeMapChromeFromTabOrder(container);

        map.on("load", () => {
          if (disposed) return;
          applyRouteMapTheme(map);
          container.inert = false;
          setAutoLiveMapState("ready");
        });

        map.on("error", () => {
          if (disposed) return;
          setAutoLiveMapState("error");
        });
      } catch {
        /* v8 ignore next */
        if (!disposed) setAutoLiveMapState("error");
      }
    }

    void mountLiveMap();

    return () => {
      disposed = true;
      const map = mapRef.current;
      mountedMarkers.forEach((entry) => entry.marker.remove());
      mountedMarkers.clear();
      if (map) cleanupRouteLayers(map, sourceIdsRef.current);
      sourceIdsRef.current = [];
      map?.remove();
      mapRef.current = null;
      if (liveMapContainer) {
        liveMapContainer.inert = false;
      }
    };
  }, [fallbackViewport.center, fallbackViewport.zoom, liveMapAvailability, liveMapEnabled, liveMapRetryKey]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreModuleRef.current;
    if (!map || liveMapState !== "ready" || !maplibregl) return;

    const visibleCoordinates = new Map<string, number>(
      visibleLiveRoutePoints
        .map((point, index) => [point.item.id, index + 1]),
    );

    markersRef.current.forEach((entry, itemId) => {
      if (!markerItems.has(itemId)) {
        entry.marker.remove();
        markersRef.current.delete(itemId);
      }
    });

    liveRoutePoints.forEach((point) => {
      const coordinates = point.item.coordinates;
      if (!coordinates) return;
      const markerLabel = String(visibleCoordinates.get(point.item.id) ?? 1);
      const markerColor = dayColorFor(point.item.day, routeDayGroups);
      const markerDisplay = activeDay === "all" || point.item.day === activeDay ? "" : "none";
      const existing = markersRef.current.get(point.item.id);
      if (existing) {
        existing.day = point.item.day;
        existing.marker.setLngLat([coordinates.lng, coordinates.lat]);
        existing.marker.getElement().style.setProperty("--day-color", markerColor);
        existing.marker.getElement().textContent = markerLabel;
        existing.marker.getElement().style.display = markerDisplay;
        return;
      }

      const markerElement = document.createElement("span");
      markerElement.className = "ofm-marker";
      markerElement.dataset.day = point.item.day;
      markerElement.setAttribute("aria-hidden", "true");
      markerElement.style.setProperty("--day-color", markerColor);
      markerElement.style.display = markerDisplay;
      markerElement.textContent = markerLabel;

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map);

      markersRef.current.set(point.item.id, { marker, day: point.item.day });
    });

    markersRef.current.forEach((entry) => {
      entry.marker.getElement().style.display = activeDay === "all" || entry.day === activeDay ? "" : "none";
    });

    sourceIdsRef.current = synchronizeRouteLayers(map, sourceIdsRef.current, routeDayGroups, activeDay);
    fitLiveRoute(map, visibleLiveRoutePoints, fallbackViewport);
  }, [activeDay, fallbackViewport, liveMapState, liveRoutePoints, visibleLiveRoutePoints, routeDayGroups, markerItems]);

  function handleRetryLiveMap() {
    markersRef.current.forEach((entry) => entry.marker.remove());
    markersRef.current.clear();
    if (mapRef.current) {
      cleanupRouteLayers(mapRef.current, sourceIdsRef.current);
      mapRef.current.remove();
    }
    sourceIdsRef.current = [];
    mapRef.current = null;
    if (mapContainerRef.current) {
      mapContainerRef.current.inert = false;
    }
    setAutoLiveMapState("idle");
    setLiveMapRetryKey((key) => key + 1);
  }

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
                  <button className={routeMapRetryButtonClassName} type="button" onClick={handleRetryLiveMap}>
                    <Icon name="redo" />
                    {t.map.retryLiveMap}
                  </button>
                ) : null}
              </div>
            </>
          )}
          {visibleUnresolvedItems.length > 0 ? (
            <div className={unresolvedPanelClassName} role="region" aria-label={t.map.unresolvedLabel}>
              <div className={unresolvedPanelActionsClassName}>
                <div className={unresolvedPanelHeaderClassName}>
                  <Icon name="warning" />
                  <span>{t.map.unresolvedTitle({ count: visibleUnresolvedItems.length })}</span>
                </div>
                <button
                  type="button"
                  className={unresolvedPanelButtonClassName}
                  disabled={!onResolveMissingCoordinates || resolvingMissing}
                  title={!onResolveMissingCoordinates ? t.map.resolveUnavailable : undefined}
                  onClick={handleResolveMissingCoordinates}
                >
                  <Icon name="location" />
                  {resolvingMissing
                    ? t.map.resolvingMissing({ count: coordinateResolutionBatch.length })
                    : t.map.resolveMissing({ count: coordinateResolutionBatch.length })}
                </button>
              </div>
              {resolvingMissing ? (
                <p className={unresolvedPanelStatusClassName}>
                  {t.map.resolveProgress({
                    count: coordinateResolutionBatch.length,
                    total: visibleUnresolvedItems.length,
                  })}
                </p>
              ) : resolutionResult ? (
                <p className={unresolvedPanelStatusClassName}>
                  {t.map.resolveResult(resolutionResult)}
                </p>
              ) : activeDay === "all" && visibleUnresolvedItems.length > coordinateResolutionBatch.length ? (
                <p className={unresolvedPanelStatusClassName}>
                  {t.map.resolveBatchHint({
                    count: coordinateResolutionBatch.length,
                    total: visibleUnresolvedItems.length,
                  })}
                </p>
              ) : null}
              <ol className={unresolvedPanelListClassName}>
                {visibleUnresolvedItems.slice(0, 6).map((item) => (
                  <li className={unresolvedPanelItemClassName} key={item.id}>
                    <span className={unresolvedPanelItemTitleClassName}>{item.activity}</span>
                    <span>{item.place}</span>
                  </li>
                ))}
              </ol>
            </div>
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
  applyRouteMapTheme,
  dayColorFor,
  fallbackRouteViewport,
  fitLiveRoute,
  getRouteCenter,
} from "./route-map.utils";
