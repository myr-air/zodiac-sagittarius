import { describe, expect, it, vi } from "vitest";
import {
  fitPreviewMap,
  previewMapBounds,
  previewMapCenter,
  type PreviewMapCoordinate,
} from "./trip-preview-map-geometry";

describe("trip preview map geometry", () => {
  it("centers the preview map around the average route coordinate", () => {
    const center = previewMapCenter([
      [100.5018, 13.7563],
      [139.6503, 35.6762],
      [126.978, 37.5665],
    ]);

    expect(center[0]).toBeCloseTo(122.3767);
    expect(center[1]).toBeCloseTo(28.999666666666666);
  });

  it("builds southwest and northeast bounds from route coordinates", () => {
    expect(previewMapBounds([
      [100.5018, 13.7563],
      [139.6503, 35.6762],
      [126.978, 37.5665],
    ])).toEqual([
      [100.5018, 13.7563],
      [139.6503, 37.5665],
    ]);
  });

  it("flies to a single coordinate and fits bounds for multi-city routes", () => {
    const map = {
      fitBounds: vi.fn(),
      flyTo: vi.fn(),
    } as unknown as import("maplibre-gl").Map;
    const bangkok: PreviewMapCoordinate = [100.5018, 13.7563];
    const tokyo: PreviewMapCoordinate = [139.6503, 35.6762];

    fitPreviewMap(map, [bangkok]);
    expect(map.flyTo).toHaveBeenCalledWith({ center: bangkok, zoom: 3.2, duration: 0 });

    fitPreviewMap(map, [bangkok, tokyo]);
    expect(map.fitBounds).toHaveBeenCalledWith(
      [bangkok, tokyo],
      { padding: 48, duration: 0, maxZoom: 4.2 },
    );
  });
});
