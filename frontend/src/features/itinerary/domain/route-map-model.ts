import { uniqueStrings } from "@/src/shared/collection";
import { formatDayLabel, groupItemsByDay } from "@/src/trip/itinerary-core";
import type { ItineraryItem } from "@/src/trip/types";

export const allDaysFilter = "all" as const;
export type AllDaysFilter = typeof allDaysFilter;
export type DayFilter = AllDaysFilter | string;

export const routeDayColors = [
  "#c24f16",
  "#2563eb",
  "#b45309",
  "#15803d",
  "#be123c",
  "#0369a1",
];

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
  if (activeDay === allDaysFilter) return allDays;
  return groups.find((group) => group.day === activeDay)?.label ?? chooseDay;
}

export function dayColorFor(day: string, groups: RouteDayGroup[]): string {
  return groups.find((group) => group.day === day)?.color ?? routeDayColors[0];
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
  const dayIndex = uniqueStrings(items.map((candidate) => candidate.day)).indexOf(item.day);
  const dayItems = items.filter((candidate) => candidate.day === item.day);
  const indexInDay = Math.max(0, dayItems.findIndex((candidate) => candidate.id === item.id));
  const x = 14 + (indexInDay / Math.max(1, dayItems.length - 1)) * 72;
  const y = 22 + dayIndex * 27 + (index % 2) * 5;
  return { x: clamp(x, 10, 90), y: clamp(y, 12, 88) };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10));
}

function isRegionalMapStop(item: ItineraryItem): boolean {
  if (!item.coordinates) return true;
  return hasCoordinates(item.coordinates);
}
