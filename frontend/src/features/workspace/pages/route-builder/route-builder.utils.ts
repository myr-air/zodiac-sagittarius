import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";
import type { GapSuggestion, GapSuggestionCategory } from "./RouteBuilderPage.types";

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

export function sortWaypoints(waypoints: Waypoint[]): Waypoint[] {
  return [...waypoints].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function renumberWaypoints(waypoints: Waypoint[]): Waypoint[] {
  return waypoints.map((waypoint, index) => ({ ...waypoint, sortOrder: index + 1 }));
}

export function computeTravelTimeMinutes(distanceKm: number): number {
  return Math.round((distanceKm / 70) * 60);
}

export function formatTravelTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export interface DistanceBadge {
  id: string;
  text: string;
}

export function computeDistanceBadges(waypoints: Waypoint[]): DistanceBadge[] {
  const sorted = sortWaypoints(waypoints);
  const badges: DistanceBadge[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const from = sorted[i];
    const to = sorted[i + 1];
    const km = haversineDistance(from.lat, from.lng, to.lat, to.lng);
    const minutes = computeTravelTimeMinutes(km);
    badges.push({
      id: `${from.id}-${to.id}`,
      text: `${formatTravelTime(minutes)} · ${Math.round(km)}km`,
    });
  }
  return badges;
}

const GAP_SUGGESTION_CATEGORIES: GapSuggestionCategory[] = ["food", "attraction", "rest"];

export function computeGapSuggestions(waypoints: Waypoint[]): GapSuggestion[] {
  const sorted = sortWaypoints(waypoints);
  const suggestions: GapSuggestion[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const from = sorted[i];
    const to = sorted[i + 1];
    const distanceKm = haversineDistance(from.lat, from.lng, to.lat, to.lng);
    if (distanceKm > 50) {
      const category = GAP_SUGGESTION_CATEGORIES[i % GAP_SUGGESTION_CATEGORIES.length];
      suggestions.push({
        id: `gap-${from.id}-${to.id}`,
        category,
        name: `Stop between ${from.name} and ${to.name}`,
        detourMinutes: Math.max(5, Math.round((distanceKm / 70) * 60 * 0.2)),
        gapIndex: i,
      });
    }
  }
  return suggestions;
}

export function insertWaypoint(
  waypoints: Waypoint[],
  afterIndex: number,
  waypoint: Waypoint,
): Waypoint[] {
  const sorted = sortWaypoints(waypoints);
  const before = sorted.slice(0, afterIndex + 1);
  const after = sorted.slice(afterIndex + 1);
  return renumberWaypoints([...before, waypoint, ...after]);
}
