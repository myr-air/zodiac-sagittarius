import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ItineraryItem } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { formatDayLabel, groupItemsByDay, type ItineraryView } from "@/src/trip/itinerary";
import { Icon } from "@/src/ui/icons";
import { TravelMotif } from "@/src/components/motifs";
import { formatTripRange, PageHeader } from "@/src/components/PageHeader";
import {
  activeMapDayFilterButtonClassName,
  DARK_TEXT,
  MINIMUM_A11Y_CONTRAST,
  hongKongShenzhenRouteViewport,
  mapDayFilterButtonClassName,
  mapDayFilterClassName,
  mapDaySwatchClassName,
  routeDayColors,
  mapSourceNoteClassName,
  routeLiveMapClassName,
  routeLiveMapPendingClassName,
  routeMapCanvasClassName,
  routeMapFallbackClassName,
  routeMapLayoutClassName,
  routeMapPanelClassName,
  routeMapPathClassName,
  routeMapPathShadowClassName,
  routeMapRetryButtonClassName,
  routeMapStatusClassName,
  routeMapSvgClassName,
  routeMarkerClassName,
  routeStopListClassName,
  routeStopListCopyClassName,
  routeStopListIndexClassName,
  routeStopListItemClassName,
  unresolvedPanelActionsClassName,
  unresolvedPanelButtonClassName,
  unresolvedPanelClassName,
  unresolvedPanelHeaderClassName,
  unresolvedPanelItemClassName,
  unresolvedPanelItemTitleClassName,
  unresolvedPanelListClassName,
  unresolvedPanelStatusClassName,
  mapZoneBayClassName,
  mapZoneClassName,
  mapZoneHongKongClassName,
  mapZoneShenzhenClassName,
  maxAllDaysCoordinateResolutionBatch,
  routeCountryViewports,
  routeMapThemeRules,
  thailandRouteViewport,
} from "./route-map.config";

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

interface RoutePoint {
  item: ItineraryItem;
  x: number;
  y: number;
}

interface RouteDayGroup {
  color: string;
  day: string;
  label: string;
  points: RoutePoint[];
}

type MarkerStyle = CSSProperties & {
  "--day-color": string;
  "--route-marker-text-color": string;
  "--x": string;
  "--y": string;
  "--marker-delay": string;
};

type DayColorStyle = CSSProperties & {
  "--day-color": string;
};

type DayFilter = "all" | string;

interface RouteViewport {
  center: [number, number];
  zoom: number;
}

export interface MapCoordinateResolutionResult {
  attempted: number;
  failed: number;
  resolved: number;
  skipped: number;
}

function hexToLinear(component: string): number {
  const value = Number.parseInt(component, 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number {
  if (color.length !== 7 || !/^#[0-9a-fA-F]{6}$/.test(color)) return 0;
  const red = hexToLinear(color.slice(1, 3));
  const green = hexToLinear(color.slice(3, 5));
  const blue = hexToLinear(color.slice(5, 7));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const brightest = Math.max(foregroundLuminance, backgroundLuminance);
  const darkest = Math.min(foregroundLuminance, backgroundLuminance);
  return (brightest + 0.05) / (darkest + 0.05);
}

function markerTextColor(color: string): string {
  if (contrastRatio("#ffffff", color) >= MINIMUM_A11Y_CONTRAST) return "#ffffff";
  return DARK_TEXT;
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
          <div className={mapDayFilterClassName} aria-label={t.map.filterLabel}>
            <button
              type="button"
              className={cn(mapDayFilterButtonClassName, activeDay === "all" && activeMapDayFilterButtonClassName)}
              aria-pressed={activeDay === "all"}
              onClick={() => setActiveDay("all")}
            >
              {t.map.allDays}
            </button>
            {routeDayGroups.map((group) => (
              <button
                type="button"
                className={cn(mapDayFilterButtonClassName, activeDay === group.day && activeMapDayFilterButtonClassName)}
                aria-pressed={activeDay === group.day}
                key={group.day}
                style={dayFilterStyle(group.color)}
                onClick={() => setActiveDay(group.day)}
              >
                <span className={mapDaySwatchClassName} aria-hidden="true" />
                {group.label}
              </button>
            ))}
          </div>

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

export function activeDayLabel(activeDay: DayFilter, groups: RouteDayGroup[], allDays = "All days", chooseDay = "Choose day"): string {
  if (activeDay === "all") return allDays;
  return groups.find((group) => group.day === activeDay)?.label ?? chooseDay;
}

function StaticRouteFallback({
  routeDayGroups,
  routePoints,
  stopListLabel,
}: {
  routeDayGroups: RouteDayGroup[];
  routePoints: RoutePoint[];
  stopListLabel: string;
}) {
  return (
    <div className={routeMapFallbackClassName}>
      <span className={cn(mapZoneClassName, mapZoneHongKongClassName)}>Hong Kong</span>
      <span className={cn(mapZoneClassName, mapZoneShenzhenClassName)}>Shenzhen</span>
      <span className={cn(mapZoneClassName, mapZoneBayClassName)}>Victoria Harbour</span>
      <svg className={routeMapSvgClassName} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        {routeDayGroups.map((group) => {
          if (group.points.length < 2) return null;
          const pathPoints = group.points.map((point) => `${point.x},${point.y}`).join(" ");
          return (
            <g key={group.day} style={routeLineStyle(group.color)}>
              <polyline className={routeMapPathShadowClassName} pathLength={1} points={pathPoints} />
              <polyline className={routeMapPathClassName} pathLength={1} points={pathPoints} />
            </g>
          );
        })}
      </svg>
      {routePoints.map((point, index) => (
        <span
          className={routeMarkerClassName}
          style={markerStyle(point, index, dayColorFor(point.item.day, routeDayGroups))}
          aria-hidden="true"
          key={point.item.id}
        >
          <span>{index + 1}</span>
        </span>
      ))}
      {routePoints.length > 0 ? (
        <ol className={routeStopListClassName} aria-label={stopListLabel} tabIndex={0}>
          {routePoints.slice(0, 8).map((point, index) => (
            <li className={routeStopListItemClassName} key={point.item.id}>
              <span
                className={routeStopListIndexClassName}
                style={routeLineStyle(dayColorFor(point.item.day, routeDayGroups))}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className={routeStopListCopyClassName}>{point.item.activity}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function buildRouteDayGroups(groups: ReturnType<typeof groupItemsByDay>, routePoints: RoutePoint[], startDate: string, locale: "en" | "th"): RouteDayGroup[] {
  return groups.map((group, index) => ({
    color: routeDayColors[index % routeDayColors.length],
    day: group.day,
    label: formatDayLabel(group.day, startDate, locale),
    points: routePoints.filter((point) => point.item.day === group.day),
  }));
}

export function dayColorFor(day: string, groups: RouteDayGroup[]): string {
  return groups.find((group) => group.day === day)?.color ?? routeDayColors[0];
}

function dayFilterStyle(color: string): DayColorStyle {
  return { "--day-color": color };
}

function routeLineStyle(color: string): DayColorStyle {
  return { "--day-color": color };
}

function routeSourceId(index: number): string {
  return `trip-route-day-${index}`;
}

function routeShadowLayerId(index: number): string {
  return `trip-route-day-${index}-shadow`;
}

function routeLineLayerId(index: number): string {
  return `trip-route-day-${index}-line`;
}

function routeOpacity(activeDay: DayFilter, day: string, visibleOpacity: number, hiddenOpacity: number): number {
  return activeDay === "all" || activeDay === day ? visibleOpacity : hiddenOpacity;
}

function cleanupRouteLayers(map: import("maplibre-gl").Map, sourceIds: string[]) {
  sourceIds.forEach((sourceId) => {
    const lineId = `${sourceId}-line`;
    const layerId = `${sourceId}-shadow`;

    if (map.getLayer(lineId)) {
      map.removeLayer(lineId);
    }

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  });
}

function synchronizeRouteLayers(map: import("maplibre-gl").Map, sourceIds: string[], dayGroups: RouteDayGroup[], activeDay: DayFilter) {
  const nextSourceIds: string[] = [];
  cleanupRouteLayers(map, sourceIds);

  dayGroups.forEach((group, index) => {
    const coordinates = group.points.flatMap((point) => {
      const coordinate = point.item.coordinates;
      return hasCoordinates(coordinate) ? [[coordinate.lng, coordinate.lat]] : [];
    });

    if (coordinates.length < 2) return;

    const sourceId = routeSourceId(index);
    const shadowId = routeShadowLayerId(index);
    const lineId = routeLineLayerId(index);

    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      } as GeoJSON.Feature<GeoJSON.LineString>,
    });

    map.addLayer({
      id: shadowId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#ffffff",
        "line-opacity": routeOpacity(activeDay, group.day, 0.82, 0),
        "line-width": 9,
      },
    });

    map.addLayer({
      id: lineId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": group.color,
        "line-opacity": routeOpacity(activeDay, group.day, 0.94, 0),
        "line-width": 4.5,
      },
    });

    nextSourceIds.push(sourceId);
  });

  return nextSourceIds;
}

export function fitLiveRoute(map: import("maplibre-gl").Map, points: RoutePoint[], fallbackViewport = thailandRouteViewport) {
  const pointsWithCoordinates = points.filter((point) => point.item.coordinates && hasCoordinates(point.item.coordinates));
  if (pointsWithCoordinates.length > 1) {
    map.fitBounds(getRouteBounds(pointsWithCoordinates), { padding: 80, maxZoom: 13 });
    return;
  }

  const coordinate = pointsWithCoordinates[0]?.item.coordinates;
  if (!coordinate) {
    map.flyTo({ center: fallbackViewport.center, essential: false, zoom: fallbackViewport.zoom });
    return;
  }
  map.flyTo({ center: [coordinate.lng, coordinate.lat], essential: false, zoom: 13 });
}

function removeMapChromeFromTabOrder(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]").forEach((element) => {
    element.tabIndex = -1;
  });
}

function hasCoordinates(coordinate: ItineraryItem["coordinates"]): coordinate is NonNullable<ItineraryItem["coordinates"]> {
  return Boolean(
    coordinate
    && Number.isFinite(coordinate.lat)
    && Number.isFinite(coordinate.lng)
    && coordinate.lat >= -90
    && coordinate.lat <= 90
    && coordinate.lng >= -180
    && coordinate.lng <= 180,
  );
}

export function getRouteCenter(points: RoutePoint[], fallbackCenter: [number, number] = thailandRouteViewport.center): [number, number] {
  const coordinates = points.map((point) => point.item.coordinates).filter(hasCoordinates);
  const lng = coordinates.reduce((total, coordinate) => total + coordinate.lng, 0) / Math.max(1, coordinates.length);
  const lat = coordinates.reduce((total, coordinate) => total + coordinate.lat, 0) / Math.max(1, coordinates.length);
  return coordinates.length ? [lng, lat] : fallbackCenter;
}

export function fallbackRouteViewport(destinationLabel: string, countries: string[] = []): RouteViewport {
  const candidates = [...countries, destinationLabel]
    .flatMap((value) => value.split(/[,+/|]/))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const destination = destinationLabel.toLowerCase();

  if (destination.includes("hong kong") && destination.includes("shenzhen")) {
    return hongKongShenzhenRouteViewport;
  }

  for (const candidate of candidates) {
    const viewport = routeCountryViewports[candidate];
    if (viewport) return viewport;
  }

  for (const [keyword, viewport] of Object.entries(routeCountryViewports)) {
    if (keyword.length > 2 && destination.includes(keyword)) return viewport;
  }

  if (destination.includes("shenzhen")) return routeCountryViewports.hk ?? thailandRouteViewport;

  return thailandRouteViewport;
}

export function applyRouteMapTheme(map: import("maplibre-gl").Map) {
  routeMapThemeRules.forEach(({ layerId, property, value }) => {
    if (!map.getLayer(layerId)) return;
    map.setPaintProperty(layerId, property, value);
  });
}

function getRouteBounds(points: RoutePoint[]): [[number, number], [number, number]] {
  const coordinates = points.map((point) => point.item.coordinates).filter(hasCoordinates);
  const longitudes = coordinates.map((coordinate) => coordinate.lng);
  const latitudes = coordinates.map((coordinate) => coordinate.lat);
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];
}

function markerStyle(point: RoutePoint, index: number, color: string): MarkerStyle {
  return {
    "--day-color": color,
    "--route-marker-text-color": markerTextColor(color),
    "--x": `${point.x}%`,
    "--y": `${point.y}%`,
    "--marker-delay": `${index * 18}ms`,
  };
}

function buildRoutePoints(items: ItineraryItem[]): RoutePoint[] {
  const regionalItems = items.filter(isRegionalMapStop);
  const coordinateItems = regionalItems.filter((item) => hasCoordinates(item.coordinates));
  const bounds = getBounds(coordinateItems);

  return regionalItems.map((item, index) => {
    const point = item.coordinates && bounds ? projectCoordinate(item.coordinates, bounds) : fallbackPoint(item, regionalItems, index);
    return { item, ...point };
  });
}

function isRegionalMapStop(item: ItineraryItem): boolean {
  if (!item.coordinates) return true;
  return hasCoordinates(item.coordinates);
}

function getBounds(items: ItineraryItem[]) {
  if (items.length < 2) return null;
  const latitudes = items.map((item) => item.coordinates!.lat);
  const longitudes = items.map((item) => item.coordinates!.lng);
  return {
    minLat: Math.min(...latitudes),
    maxLat: Math.max(...latitudes),
    minLng: Math.min(...longitudes),
    maxLng: Math.max(...longitudes),
  };
}

function projectCoordinate(
  coordinate: NonNullable<ItineraryItem["coordinates"]>,
  bounds: NonNullable<ReturnType<typeof getBounds>>,
): { x: number; y: number } {
  const lngRange = Math.max(bounds.maxLng - bounds.minLng, 0.01);
  const latRange = Math.max(bounds.maxLat - bounds.minLat, 0.01);
  const x = 12 + ((coordinate.lng - bounds.minLng) / lngRange) * 76;
  const y = 86 - ((coordinate.lat - bounds.minLat) / latRange) * 72;
  return { x: clamp(x, 9, 91), y: clamp(y, 9, 91) };
}

function fallbackPoint(item: ItineraryItem, items: ItineraryItem[], index: number): { x: number; y: number } {
  const dayIndex = Array.from(new Set(items.map((candidate) => candidate.day))).indexOf(item.day);
  const dayItems = items.filter((candidate) => candidate.day === item.day);
  const indexInDay = Math.max(0, dayItems.findIndex((candidate) => candidate.id === item.id));
  const x = 14 + (indexInDay / Math.max(1, dayItems.length - 1)) * 72;
  const y = 22 + dayIndex * 27 + (index % 2) * 5;
  return { x: clamp(x, 10, 90), y: clamp(y, 12, 88) };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10));
}
