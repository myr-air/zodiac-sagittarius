import type { CSSProperties, RefObject } from "react";
import type { Messages } from "@/src/i18n/messages";
import type { MapLoadState } from "@/src/shared/map-load-state";
import type { ItineraryView } from "@/src/trip/itinerary-core";
import type { ItineraryItem } from "@/src/trip/types";

export const allDaysFilter = "all" as const;
export type AllDaysFilter = typeof allDaysFilter;
export type DayFilter = AllDaysFilter | string;
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

export type MapCoordinateResolutionHandler = (
  items: ItineraryItem[],
) =>
  | Promise<MapCoordinateResolutionResult | void>
  | MapCoordinateResolutionResult
  | void;

export interface RouteMapViewProps {
  countries?: string[];
  destinationLabel?: string;
  endDate: string;
  items: ItineraryItem[];
  itineraryView?: ItineraryView;
  liveMapAvailability?: "auto" | "loading" | "error";
  liveMapEnabled?: boolean;
  onResolveMissingCoordinates?: MapCoordinateResolutionHandler;
  startDate: string;
  tripName: string;
}

export type RouteMapCanvasCopy = Messages["map"];

export interface RouteMapCanvasProps {
  activeDay: DayFilter;
  coordinateResolutionBatch: ItineraryItem[];
  copy: RouteMapCanvasCopy;
  liveMapAvailability: "auto" | "loading" | "error";
  liveMapEnabled: boolean;
  liveMapState: RouteLiveMapState;
  mapContainerRef: RefObject<HTMLDivElement | null>;
  onActiveDayChange: (day: DayFilter) => void;
  onResolveMissingCoordinates?: () => Promise<void>;
  onRetryLiveMap: () => void;
  resolutionResult: MapCoordinateResolutionResult | null;
  resolvingMissing: boolean;
  routeDayGroups: RouteDayGroup[];
  visibleRouteDayGroups: RouteDayGroup[];
  visibleRoutePoints: RoutePoint[];
  visibleUnresolvedItems: ItineraryItem[];
}

export interface RouteMapUnresolvedPanelCopy {
  label: string;
  resolveBatchHint: (params: { count: number; total: number }) => string;
  resolveMissing: (params: { count: number }) => string;
  resolveProgress: (params: { count: number; total: number }) => string;
  resolveResult: (result: MapCoordinateResolutionResult) => string;
  resolveUnavailable: string;
  resolvingMissing: (params: { count: number }) => string;
  title: (params: { count: number }) => string;
}

export interface RouteMapUnresolvedPanelProps {
  activeDay: DayFilter;
  coordinateResolutionBatch: ItineraryItem[];
  copy: RouteMapUnresolvedPanelCopy;
  onResolveMissingCoordinates?: () => void;
  resolutionResult: MapCoordinateResolutionResult | null;
  resolvingMissing: boolean;
  visibleUnresolvedItems: ItineraryItem[];
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
