import { routeMapThemeRules, thailandRouteViewport } from "./route-map.config";
import { hasCoordinates } from "@/src/features/itinerary/domain/route-map-model";
import type { LiveRouteMarkerRegistry } from "./route-map.live-markers";
import { cleanupRouteLayers } from "./route-map.live-layers";
import type { RoutePoint } from "./route-map.types";

export function fitLiveRoute(map: import("maplibre-gl").Map, points: RoutePoint[], fallbackViewport = thailandRouteViewport) {
  const pointsWithCoordinates = points.filter((point) => point.item.coordinates && hasCoordinates(point.item.coordinates));
  if (pointsWithCoordinates.length > 1) {
    map.fitBounds(getRouteBounds(pointsWithCoordinates), { padding: 80, maxZoom: 13 });
    return;
  }

  const coordinate = pointsWithCoordinates[0]?.item.coordinates;
  if (!coordinate) {
    map.flyTo({ center: fallbackViewport.center, essential: false, zoom: fallbackViewport.zoom });
    return;
  }
  map.flyTo({ center: [coordinate.lng, coordinate.lat], essential: false, zoom: 13 });
}

export function applyRouteMapTheme(map: import("maplibre-gl").Map) {
  routeMapThemeRules.forEach(({ layerId, property, value }) => {
    if (!map.getLayer(layerId)) return;
    map.setPaintProperty(layerId, property, value);
  });
}

export function removeMapChromeFromTabOrder(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]").forEach((element) => {
    element.tabIndex = -1;
  });
}

export function cleanupLiveRouteMap({
  container,
  map,
  markers,
  sourceIds,
}: {
  container: HTMLElement | null;
  map: import("maplibre-gl").Map | null;
  markers: LiveRouteMarkerRegistry;
  sourceIds: string[];
}): { map: null; sourceIds: [] } {
  markers.forEach((entry) => entry.marker.remove());
  markers.clear();
  if (map) {
    cleanupRouteLayers(map, sourceIds);
    map.remove();
  }
  if (container) {
    container.inert = false;
  }
  return { map: null, sourceIds: [] };
}

function getRouteBounds(points: RoutePoint[]): [[number, number], [number, number]] {
  const coordinates = points.map((point) => point.item.coordinates).filter(hasCoordinates);
  const longitudes = coordinates.map((coordinate) => coordinate.lng);
  const latitudes = coordinates.map((coordinate) => coordinate.lat);
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];
}
