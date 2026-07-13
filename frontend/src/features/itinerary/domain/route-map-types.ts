import type { ItineraryItem } from "@/src/trip/types";

export const allDaysFilter = "all" as const;
export type AllDaysFilter = typeof allDaysFilter;
export type DayFilter = AllDaysFilter | string;

export const routeDayColors = [
  { color: "#c24f16", label: "Day 1" },
  { color: "#2563eb", label: "Day 2" },
  { color: "#b45309", label: "Day 3" },
  { color: "#15803d", label: "Day 4" },
  { color: "#be123c", label: "Day 5" },
  { color: "#0369a1", label: "Day 6" },
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
