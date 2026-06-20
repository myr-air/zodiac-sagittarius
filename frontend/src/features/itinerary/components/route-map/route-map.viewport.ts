import {
  hongKongShenzhenRouteViewport,
  routeCountryViewports,
  thailandRouteViewport,
  type RouteViewport,
} from "./route-map.config";
import type { RoutePoint } from "./route-map.types";
import { hasCoordinates } from "./route-map.utils";

export function getRouteCenter(
  points: RoutePoint[],
  fallbackCenter: [number, number] = thailandRouteViewport.center,
): [number, number] {
  const coordinates = points.map((point) => point.item.coordinates).filter(hasCoordinates);
  const lng = coordinates.reduce((total, coordinate) => total + coordinate.lng, 0) / Math.max(1, coordinates.length);
  const lat = coordinates.reduce((total, coordinate) => total + coordinate.lat, 0) / Math.max(1, coordinates.length);
  return coordinates.length ? [lng, lat] : fallbackCenter;
}

export function fallbackRouteViewport(destinationLabel: string, countries: string[] = []): RouteViewport {
  const candidates = [...countries, destinationLabel]
    .flatMap((value) => value.split(/[,+/|]/))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const destination = destinationLabel.toLowerCase();

  if (destination.includes("hong kong") && destination.includes("shenzhen")) {
    return hongKongShenzhenRouteViewport;
  }

  for (const candidate of candidates) {
    const viewport = routeCountryViewports[candidate];
    if (viewport) return viewport;
  }

  for (const [keyword, viewport] of Object.entries(routeCountryViewports)) {
    if (keyword.length > 2 && destination.includes(keyword)) return viewport;
  }

  if (destination.includes("shenzhen")) return routeCountryViewports.hk ?? thailandRouteViewport;

  return thailandRouteViewport;
}
