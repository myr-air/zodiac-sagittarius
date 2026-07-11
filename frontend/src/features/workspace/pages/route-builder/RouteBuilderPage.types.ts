import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";

export interface RouteBuilderPageProps {
  waypoints: Waypoint[];
  tripDestination?: { lat: number; lng: number; label: string };
  onWaypointsChange: (waypoints: Waypoint[]) => void;
  liveMapEnabled?: boolean;
}

export interface WaypointMapSurfaceProps {
  waypoints: Waypoint[];
  tripDestination?: { lat: number; lng: number; label: string };
  onWaypointsChange: (waypoints: Waypoint[]) => void;
  liveMapEnabled?: boolean;
  className?: string;
}

export type GapSuggestionCategory = "food" | "attraction" | "rest";

export interface GapSuggestion {
  id: string;
  category: GapSuggestionCategory;
  name: string;
  detourMinutes: number;
  gapIndex: number;
}

export interface GapSuggestionsRailProps {
  waypoints: Waypoint[];
  selectedSuggestionId?: string;
  onSelect: (suggestion: GapSuggestion) => void;
  className?: string;
}
