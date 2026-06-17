import { type CSSProperties } from "react";
import { formatDayLabel, groupItemsByDay } from "@/src/trip/itinerary";
import type { ItineraryItem } from "@/src/trip/types";
import {
  DARK_TEXT,
  MINIMUM_A11Y_CONTRAST,
  hongKongShenzhenRouteViewport,
  routeCountryViewports,
  routeDayColors,
  routeMapThemeRules,
  thailandRouteViewport,
  type RouteViewport,
} from "./route-map.config";

export type DayFilter = "all" | string;

export interface RoutePoint {
  item: ItineraryItem;
  x: number;
  y: number;
}

export interface RouteDayGroup {
  color: string;
  day: string;
  label: string;
  points: RoutePoint[];
}

export type MarkerStyle = CSSProperties & {
  "--day-color": string;
  "--route-marker-text-color": string;
  "--x": string;
  "--y": string;
  "--marker-delay": string;
};

export type DayColorStyle = CSSProperties & {
  "--day-color": string;
};

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

export function markerTextColor(color: string): string {
  if (contrastRatio("#ffffff", color) >= MINIMUM_A11Y_CONTRAST) return "#ffffff";
  return DARK_TEXT;
}

export function hasCoordinates(coordinate: ItineraryItem["coordinates"]): coordinate is NonNullable<ItineraryItem["coordinates"]> {
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

export function activeDayLabel(
  activeDay: DayFilter,
  groups: RouteDayGroup[],
  allDays = "All days",
  chooseDay = "Choose day",
): string {
  if (activeDay === "all") return allDays;
  return groups.find((group) => group.day === activeDay)?.label ?? chooseDay;
}

export function dayColorFor(day: string, groups: RouteDayGroup[]): string {
  return groups.find((group) => group.day === day)?.color ?? routeDayColors[0];
}

export function routeLineStyle(color: string): DayColorStyle {
  return { "--day-color": color };
}

export function dayFilterStyle(color: string): DayColorStyle {
  return { "--day-color": color };
}

export function markerStyle(point: RoutePoint, index: number, color: string): MarkerStyle {
  return {
    "--day-color": color,
    "--route-marker-text-color": markerTextColor(color),
    "--x": `${point.x}%`,
    "--y": `${point.y}%`,
    "--marker-delay": `${index * 18}ms`,
  };
}

export function buildRouteDayGroups(
  groups: ReturnType<typeof groupItemsByDay>,
  routePoints: RoutePoint[],
  startDate: string,
  locale: "en" | "th",
): RouteDayGroup[] {
  return groups.map((group, index) => ({
    color: routeDayColors[index % routeDayColors.length],
    day: group.day,
    label: formatDayLabel(group.day, startDate, locale),
    points: routePoints.filter((point) => point.item.day === group.day),
  }));
}

export function buildRoutePoints(items: ItineraryItem[]): RoutePoint[] {
  const regionalItems = items.filter(isRegionalMapStop);
  const coordinateItems = regionalItems.filter((item) => hasCoordinates(item.coordinates));
  const bounds = getBounds(coordinateItems);

  return regionalItems.map((item, index) => {
    const point = item.coordinates && bounds ? projectCoordinate(item.coordinates, bounds) : fallbackPoint(item, regionalItems, index);
    return { item, ...point };
  });
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

export function removeMapChromeFromTabOrder(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]").forEach((element) => {
    element.tabIndex = -1;
  });
}

export function synchronizeRouteLayers(
  map: import("maplibre-gl").Map,
  sourceIds: string[],
  dayGroups: RouteDayGroup[],
  activeDay: DayFilter,
) {
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

export function cleanupRouteLayers(map: import("maplibre-gl").Map, sourceIds: string[]) {
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

function routeOpacity(activeDay: DayFilter, day: string, visibleOpacity: number, hiddenOpacity: number): number {
  return activeDay === "all" || activeDay === day ? visibleOpacity : hiddenOpacity;
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

function getRouteBounds(points: RoutePoint[]): [[number, number], [number, number]] {
  const coordinates = points.map((point) => point.item.coordinates).filter(hasCoordinates);
  const longitudes = coordinates.map((coordinate) => coordinate.lng);
  const latitudes = coordinates.map((coordinate) => coordinate.lat);
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];
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

function isRegionalMapStop(item: ItineraryItem): boolean {
  if (!item.coordinates) return true;
  return hasCoordinates(item.coordinates);
}

