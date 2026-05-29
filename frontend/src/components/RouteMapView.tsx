import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ItineraryItem } from "@/src/trip/types";
import { formatDayLabel, groupItemsByDay } from "@/src/trip/itinerary";
import { Icon } from "./icons";
import { TravelMotif } from "./motifs";
import { formatTripRange, PageHeader } from "./PageHeader";

interface RouteMapViewProps {
  endDate: string;
  items: ItineraryItem[];
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
  "--x": string;
  "--y": string;
  "--marker-delay": string;
};

type DayColorStyle = CSSProperties & {
  "--day-color": string;
};

type DayFilter = "all" | string;

const routeDayColors = ["#2563eb", "#0f766e", "#f97316", "#0891b2", "#16a34a", "#dc2626"];

export function RouteMapView({ endDate, items, startDate, tripName }: RouteMapViewProps) {
  const groups = useMemo(() => groupItemsByDay(items), [items]);
  const routePoints = useMemo(() => buildRoutePoints(items), [items]);
  const routeDayGroups = useMemo(() => buildRouteDayGroups(groups, routePoints, startDate), [groups, routePoints, startDate]);
  const [activeDay, setActiveDay] = useState<DayFilter>("all");
  const visibleRouteDayGroups = useMemo(
    () => routeDayGroups.filter((group) => activeDay === "all" || group.day === activeDay),
    [activeDay, routeDayGroups],
  );
  const visibleRoutePoints = useMemo(
    () => (activeDay === "all" ? routePoints : routePoints.filter((point) => point.item.day === activeDay)),
    [activeDay, routePoints],
  );
  const liveRoutePoints = useMemo(() => routePoints.filter((point) => point.item.coordinates), [routePoints]);
  const visibleLiveRoutePoints = useMemo(
    () => (activeDay === "all" ? liveRoutePoints : liveRoutePoints.filter((point) => point.item.day === activeDay)),
    [activeDay, liveRoutePoints],
  );
  const warningCount = items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const [liveMapState, setLiveMapState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<Map<string, import("maplibre-gl").Marker>>(new Map());
  const activeDayRef = useRef<DayFilter>(activeDay);

  useEffect(() => {
    activeDayRef.current = activeDay;
  }, [activeDay]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || liveRoutePoints.length === 0) return undefined;
    if (process.env.NODE_ENV === "test") return undefined;

    let disposed = false;
    let liveMapContainer: HTMLDivElement | null = null;
    const markers = markersRef.current;

    async function mountLiveMap() {
      setLiveMapState("loading");

      try {
        const maplibregl = await import("maplibre-gl");
        const container = mapContainerRef.current;
        if (!container || disposed) return;
        liveMapContainer = container;
        container.inert = true;
        container.tabIndex = -1;

        const map = new maplibregl.Map({
          attributionControl: { compact: true },
          center: getRouteCenter(liveRoutePoints),
          container,
          cooperativeGestures: true,
          style: "https://tiles.openfreemap.org/styles/positron",
          zoom: 10,
        });

        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        removeMapChromeFromTabOrder(container);

        liveRoutePoints.forEach((point, index) => {
          const coordinates = point.item.coordinates;
          if (!coordinates) return;

          const markerElement = document.createElement("span");
          markerElement.className = "ofm-marker";
          markerElement.dataset.day = point.item.day;
          markerElement.setAttribute("aria-hidden", "true");
          markerElement.style.setProperty("--day-color", dayColorFor(point.item.day, routeDayGroups));
          markerElement.textContent = String(index + 1);

          const marker = new maplibregl.Marker({ element: markerElement })
            .setLngLat([coordinates.lng, coordinates.lat])
            .addTo(map);
          markers.set(point.item.id, marker);
        });

        map.on("load", () => {
          if (disposed) return;
          routeDayGroups.forEach((group, index) => {
            const coordinates = group.points.flatMap((point) => {
              const coordinate = point.item.coordinates;
              return coordinate ? [[coordinate.lng, coordinate.lat]] : [];
            });
            if (coordinates.length < 2) return;

            map.addSource(routeSourceId(index), {
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
              id: routeShadowLayerId(index),
              type: "line",
              source: routeSourceId(index),
              paint: {
                "line-color": "#ffffff",
                "line-opacity": routeOpacity(activeDayRef.current, group.day, 0.82, 0),
                "line-width": 9,
              },
            });
            map.addLayer({
              id: routeLineLayerId(index),
              type: "line",
              source: routeSourceId(index),
              paint: {
                "line-color": group.color,
                "line-opacity": routeOpacity(activeDayRef.current, group.day, 0.94, 0),
                "line-width": 4.5,
              },
            });
          });
          fitLiveRoute(map, activeDayRef.current === "all" ? liveRoutePoints : liveRoutePoints.filter((point) => point.item.day === activeDayRef.current));
          removeMapChromeFromTabOrder(container);
          setLiveMapState("ready");
        });

        map.on("error", () => {
          if (!disposed) setLiveMapState("error");
        });
      } catch {
        if (!disposed) setLiveMapState("error");
      }
    }

    void mountLiveMap();

    return () => {
      disposed = true;
      markers.forEach((marker) => marker.remove());
      markers.clear();
      mapRef.current?.remove();
      mapRef.current = null;
      if (liveMapContainer) {
        liveMapContainer.inert = false;
      }
    };
  }, [liveRoutePoints, routeDayGroups]);

  useEffect(() => {
    markersRef.current.forEach((marker) => {
      const visible = activeDay === "all" || marker.getElement().dataset.day === activeDay;
      marker.getElement().style.display = visible ? "" : "none";
    });

    const map = mapRef.current;
    if (!map || liveMapState !== "ready") return;

    routeDayGroups.forEach((group, index) => {
      if (map.getLayer(routeShadowLayerId(index))) {
        map.setPaintProperty(routeShadowLayerId(index), "line-opacity", routeOpacity(activeDay, group.day, 0.82, 0));
      }
      if (map.getLayer(routeLineLayerId(index))) {
        map.setPaintProperty(routeLineLayerId(index), "line-opacity", routeOpacity(activeDay, group.day, 0.94, 0));
      }
    });
    fitLiveRoute(map, visibleLiveRoutePoints);
  }, [activeDay, liveMapState, routeDayGroups, visibleLiveRoutePoints]);

  return (
    <section className="route-map-panel" id="map" aria-labelledby="route-map-heading" aria-label="Route map">
      <PageHeader
        title="แผนที่"
        subtitle={tripName}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(startDate, endDate)}</span>
            <span><Icon name="location" /> {visibleRoutePoints.length}/{routePoints.length} stops visible</span>
            <span><Icon name="warning" /> {warningCount} warnings</span>
            <span><Icon name="route" /> {activeDayLabel(activeDay, routeDayGroups)}</span>
          </>
        )}
        motif={<TravelMotif tone="route" />}
      />

      <div className="route-map-layout">
        <div className="route-map-canvas" aria-label="Map preview of the Hong Kong and Shenzhen itinerary route">
          <div className="map-day-filter" aria-label="เลือกวันบนแผนที่">
            <button
              type="button"
              className={activeDay === "all" ? "map-day-filter-button map-day-filter-button--active" : "map-day-filter-button"}
              aria-pressed={activeDay === "all"}
              onClick={() => setActiveDay("all")}
            >
              ทุกวัน
            </button>
            {routeDayGroups.map((group) => (
              <button
                type="button"
                className={activeDay === group.day ? "map-day-filter-button map-day-filter-button--active" : "map-day-filter-button"}
                aria-pressed={activeDay === group.day}
                key={group.day}
                style={dayFilterStyle(group.color)}
                onClick={() => setActiveDay(group.day)}
              >
                <span className="map-day-swatch" aria-hidden="true" />
                {group.label}
              </button>
            ))}
          </div>

          {liveMapState !== "error" ? (
            <>
              <div className="route-live-map" ref={mapContainerRef} aria-hidden="true" />
              {liveMapState !== "ready" ? <p className="route-map-status">{liveMapStatusText(liveMapState)}</p> : null}
            </>
          ) : (
            <>
              <span className="map-zone map-zone--hk">Hong Kong</span>
              <span className="map-zone map-zone--sz">Shenzhen</span>
              <span className="map-zone map-zone--bay">Victoria Harbour</span>
              <svg className="route-map-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                {visibleRouteDayGroups.map((group) => {
                  const pathPoints = group.points.map((point) => `${point.x},${point.y}`).join(" ");
                  return (
                    <g key={group.day} style={routeLineStyle(group.color)}>
                      <polyline className="route-map-path route-map-path--shadow" points={pathPoints} />
                      <polyline className="route-map-path" points={pathPoints} />
                    </g>
                  );
                })}
              </svg>
              {visibleRoutePoints.map((point, index) => (
                <span
                  className="route-marker"
                  style={markerStyle(point, index, dayColorFor(point.item.day, routeDayGroups))}
                  aria-hidden="true"
                  key={point.item.id}
                >
                  <span>{index + 1}</span>
                </span>
              ))}
            </>
          )}
          <p className="map-source-note">Live tiles: OpenFreeMap + OpenStreetMap data · Renderer: MapLibre GL JS</p>
        </div>
      </div>
    </section>
  );
}

function liveMapStatusText(state: "idle" | "loading" | "ready" | "error"): string {
  if (state === "error") return "โหลดแผนที่สดไม่สำเร็จ แสดงแผนผังสำรองไว้ก่อน";
  return "กำลังโหลดแผนที่จาก OpenFreeMap";
}

function activeDayLabel(activeDay: DayFilter, groups: RouteDayGroup[]): string {
  if (activeDay === "all") return "ทุกวัน";
  return groups.find((group) => group.day === activeDay)?.label ?? "เลือกวัน";
}

function buildRouteDayGroups(groups: ReturnType<typeof groupItemsByDay>, routePoints: RoutePoint[], startDate: string): RouteDayGroup[] {
  return groups
    .map((group, index) => ({
      color: routeDayColors[index % routeDayColors.length],
      day: group.day,
      label: formatDayLabel(group.day, startDate),
      points: routePoints.filter((point) => point.item.day === group.day),
    }))
    .filter((group) => group.points.length > 0);
}

function dayColorFor(day: string, groups: RouteDayGroup[]): string {
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

function fitLiveRoute(map: import("maplibre-gl").Map, points: RoutePoint[]) {
  const pointsWithCoordinates = points.filter((point) => point.item.coordinates);
  if (pointsWithCoordinates.length > 1) {
    map.fitBounds(getRouteBounds(pointsWithCoordinates), { padding: 80, maxZoom: 13 });
    return;
  }

  const coordinate = pointsWithCoordinates[0]?.item.coordinates;
  if (!coordinate) return;
  map.flyTo({ center: [coordinate.lng, coordinate.lat], essential: false, zoom: 13 });
}

function removeMapChromeFromTabOrder(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]").forEach((element) => {
    element.tabIndex = -1;
  });
}

function hasCoordinates(coordinate: ItineraryItem["coordinates"]): coordinate is NonNullable<ItineraryItem["coordinates"]> {
  return Boolean(coordinate);
}

function getRouteCenter(points: RoutePoint[]): [number, number] {
  const coordinates = points.map((point) => point.item.coordinates).filter(hasCoordinates);
  const lng = coordinates.reduce((total, coordinate) => total + coordinate.lng, 0) / Math.max(1, coordinates.length);
  const lat = coordinates.reduce((total, coordinate) => total + coordinate.lat, 0) / Math.max(1, coordinates.length);
  return [lng || 114.16, lat || 22.3];
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
    "--x": `${point.x}%`,
    "--y": `${point.y}%`,
    "--marker-delay": `${index * 18}ms`,
  };
}

function buildRoutePoints(items: ItineraryItem[]): RoutePoint[] {
  const regionalItems = items.filter(isRegionalMapStop);
  const coordinateItems = regionalItems.filter((item) => item.coordinates);
  const bounds = getBounds(coordinateItems);

  return regionalItems.map((item, index) => {
    const point = item.coordinates && bounds ? projectCoordinate(item.coordinates, bounds) : fallbackPoint(item, regionalItems, index);
    return { item, ...point };
  });
}

function isRegionalMapStop(item: ItineraryItem): boolean {
  return !item.coordinates || item.coordinates.lng > 110;
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
