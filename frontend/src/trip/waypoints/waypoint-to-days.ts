import type { Waypoint } from "./waypoint-types";

/** Result of converting waypoints into day groups. */
export interface WaypointDayGroup {
  date: string; // YYYY-MM-DD format
  label: string; // "Day 1", "Day 2", etc.
  waypoints: Waypoint[]; // waypoints assigned to this day group
}

/**
 * Haversine distance in kilometers between two coordinates.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Convert waypoints into day groups for itinerary structure.
 *
 * Each waypoint becomes its own day by default. Waypoints within 50km
 * proximity of each other merge into the same day group.
 *
 * @param waypoints - Sorted by sortOrder (caller responsibility)
 * @param startDate - Starting date in YYYY-MM-DD format
 * @returns Array of day groups, one per day
 */
export function convertWaypointsToDays(waypoints: Waypoint[], startDate: string): WaypointDayGroup[] {
  if (!waypoints || waypoints.length === 0) return [];

  const sorted = [...waypoints].sort((a, b) => a.sortOrder - b.sortOrder);

  // Group waypoints by 50km proximity
  const PROXIMITY_KM = 50;
  const groups: Waypoint[][] = [];

  for (const wp of sorted) {
    // Try to find an existing group where this waypoint is within 50km of any member
    let found = false;
    for (const group of groups) {
      const isNearby = group.some(
        (g) => haversineDistance(g.lat, g.lng, wp.lat, wp.lng) <= PROXIMITY_KM,
      );
      if (isNearby) {
        group.push(wp);
        found = true;
        break;
      }
    }
    if (!found) {
      groups.push([wp]);
    }
  }

  // Convert groups to WaypointDayGroup with date labels
  const baseDate = new Date(startDate);
  return groups.map((group, index) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + index);
    const dateStr = date.toISOString().slice(0, 10);
    return {
      date: dateStr,
      label: `Day ${index + 1}`,
      waypoints: group,
    };
  });
}
