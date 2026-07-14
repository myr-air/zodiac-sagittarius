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
