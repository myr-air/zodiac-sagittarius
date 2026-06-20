import type { DayFilter, RouteDayGroup, RoutePoint } from "./route-map.types";
import { dayColorFor } from "./route-map.utils";

export type LiveRouteMarkerRegistry = Map<
  string,
  { marker: import("maplibre-gl").Marker; day: string }
>;

export function synchronizeLiveRouteMarkers({
  activeDay,
  liveRoutePoints,
  map,
  maplibregl,
  markerItems,
  markers,
  routeDayGroups,
  visibleLiveRoutePoints,
}: {
  activeDay: DayFilter;
  liveRoutePoints: RoutePoint[];
  map: import("maplibre-gl").Map;
  maplibregl: typeof import("maplibre-gl");
  markerItems: Set<string>;
  markers: LiveRouteMarkerRegistry;
  routeDayGroups: RouteDayGroup[];
  visibleLiveRoutePoints: RoutePoint[];
}) {
  const visibleCoordinates = new Map<string, number>(
    visibleLiveRoutePoints.map((point, index) => [point.item.id, index + 1]),
  );

  markers.forEach((entry, itemId) => {
    if (!markerItems.has(itemId)) {
      entry.marker.remove();
      markers.delete(itemId);
    }
  });

  liveRoutePoints.forEach((point) => {
    const coordinates = point.item.coordinates;
    if (!coordinates) return;
    const markerLabel = String(visibleCoordinates.get(point.item.id) ?? 1);
    const markerColor = dayColorFor(point.item.day, routeDayGroups);
    const markerDisplay = activeDay === "all" || point.item.day === activeDay ? "" : "none";
    const existing = markers.get(point.item.id);
    if (existing) {
      existing.day = point.item.day;
      existing.marker.setLngLat([coordinates.lng, coordinates.lat]);
      existing.marker.getElement().style.setProperty("--day-color", markerColor);
      existing.marker.getElement().textContent = markerLabel;
      existing.marker.getElement().style.display = markerDisplay;
      return;
    }

    const markerElement = document.createElement("span");
    markerElement.className = "ofm-marker";
    markerElement.dataset.day = point.item.day;
    markerElement.setAttribute("aria-hidden", "true");
    markerElement.style.setProperty("--day-color", markerColor);
    markerElement.style.display = markerDisplay;
    markerElement.textContent = markerLabel;

    const marker = new maplibregl.Marker({ element: markerElement })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(map);

    markers.set(point.item.id, { marker, day: point.item.day });
  });

  markers.forEach((entry) => {
    entry.marker.getElement().style.display =
      activeDay === "all" || entry.day === activeDay ? "" : "none";
  });
}
