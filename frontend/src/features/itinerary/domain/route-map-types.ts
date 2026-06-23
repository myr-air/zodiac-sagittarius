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

export interface VisibleRouteMapState {
  coordinateResolutionBatch: ItineraryItem[];
  visibleLiveRoutePoints: RoutePoint[];
  visibleRouteDayGroups: RouteDayGroup[];
  visibleRoutePoints: RoutePoint[];
  visibleUnresolvedItems: ItineraryItem[];
}
