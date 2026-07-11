import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";
import type { WaypointDayGroup } from "@/src/trip/waypoints/waypoint-to-days";

export interface WaypointConversionBannerProps {
  /** Waypoints available for conversion */
  waypoints: Waypoint[];
  /** Trip start date for day generation (YYYY-MM-DD) */
  startDate: string;
  /** Whether itinerary items already exist (banner hides if true) */
  hasExistingItinerary: boolean;
  /** Called when user accepts conversion with generated day groups */
  onConvert: (dayGroups: WaypointDayGroup[]) => void;
  /** Called when user dismisses the banner */
  onDismiss: () => void;
}
