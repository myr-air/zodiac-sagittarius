import type { CSSProperties } from "react";
import type { MapLoadState } from "@/src/shared/map-load-state";
import type { ItineraryItem } from "@/src/trip/types";

export type DayFilter = "all" | string;
export type RouteLiveMapState = MapLoadState;

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

export interface MapCoordinateResolutionResult {
  attempted: number;
  failed: number;
  resolved: number;
  skipped: number;
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
