import type GeoJSON from "geojson";
import { hasCoordinates } from "@/src/features/itinerary/domain/route-map-model";
import { allDaysFilter, type DayFilter, type RouteDayGroup } from "./route-map.types";

export function synchronizeRouteLayers(
  map: import("maplibre-gl").Map,
  sourceIds: string[],
  dayGroups: RouteDayGroup[],
  activeDay: DayFilter,
) {
  const nextSourceIds: string[] = [];
  cleanupRouteLayers(map, sourceIds);

  dayGroups.forEach((group, index) => {
    const coordinates = group.points.flatMap((point) => {
      const coordinate = point.item.coordinates;
      return hasCoordinates(coordinate) ? [[coordinate.lng, coordinate.lat]] : [];
    });

    if (coordinates.length < 2) return;

    const sourceId = routeSourceId(index);
    const shadowId = routeShadowLayerId(index);
    const lineId = routeLineLayerId(index);

    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      } as GeoJSON.Feature<GeoJSON.LineString>,
    });

    map.addLayer({
      id: shadowId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#ffffff",
        "line-opacity": routeOpacity(activeDay, group.day, 0.82, 0),
        "line-width": 9,
      },
    });

    map.addLayer({
      id: lineId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": group.color,
        "line-opacity": routeOpacity(activeDay, group.day, 0.94, 0),
        "line-width": 4.5,
      },
    });

    nextSourceIds.push(sourceId);
  });

  return nextSourceIds;
}

export function cleanupRouteLayers(map: import("maplibre-gl").Map, sourceIds: string[]) {
  sourceIds.forEach((sourceId) => {
    const lineId = `${sourceId}-line`;
    const layerId = `${sourceId}-shadow`;

    if (map.getLayer(lineId)) {
      map.removeLayer(lineId);
    }

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  });
}

function routeOpacity(activeDay: DayFilter, day: string, visibleOpacity: number, hiddenOpacity: number): number {
  return activeDay === allDaysFilter || activeDay === day ? visibleOpacity : hiddenOpacity;
}

function routeSourceId(index: number): string {
  return `trip-route-day-${index}`;
}

function routeShadowLayerId(index: number): string {
  return `trip-route-day-${index}-shadow`;
}

function routeLineLayerId(index: number): string {
  return `trip-route-day-${index}-line`;
}
