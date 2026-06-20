export type PreviewMapCoordinate = [number, number];
export type PreviewMapBounds = [PreviewMapCoordinate, PreviewMapCoordinate];

export function previewMapCenter(coordinates: PreviewMapCoordinate[]): PreviewMapCoordinate {
  const totals = coordinates.reduce(
    (current, coordinate) => [current[0] + coordinate[0], current[1] + coordinate[1]] as PreviewMapCoordinate,
    [0, 0] as PreviewMapCoordinate,
  );
  return [totals[0] / coordinates.length, totals[1] / coordinates.length];
}

export function previewMapBounds(coordinates: PreviewMapCoordinate[]): PreviewMapBounds {
  const lngs = coordinates.map((coordinate) => coordinate[0]);
  const lats = coordinates.map((coordinate) => coordinate[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export function fitPreviewMap(map: import("maplibre-gl").Map, coordinates: PreviewMapCoordinate[]) {
  if (coordinates.length <= 1) {
    map.flyTo({ center: coordinates[0], zoom: 3.2, duration: 0 });
    return;
  }
  map.fitBounds(previewMapBounds(coordinates), { padding: 48, duration: 0, maxZoom: 4.2 });
}
