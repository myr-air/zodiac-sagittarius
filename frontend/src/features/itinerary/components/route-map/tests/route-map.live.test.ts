import { describe, expect, it, vi } from "vitest";
import {
  applyRouteMapTheme,
  cleanupLiveRouteMap,
  fitLiveRoute,
} from "../route-map.live";

describe("route map live utilities", () => {
  it("uses fallback center and supports live route fit transitions", () => {
    const map = { flyTo: vi.fn(), fitBounds: vi.fn() };
    fitLiveRoute(map as never, []);
    expect(map.flyTo).toHaveBeenCalledWith({ center: [100.9925, 15.87], essential: false, zoom: 5 });
    expect(map.fitBounds).not.toHaveBeenCalled();
  });

  it("applies route map theme rules only to existing layers", () => {
    const themedMap = {
      getLayer: vi.fn((layerId: string) => layerId === "water"),
      setPaintProperty: vi.fn(),
    };

    applyRouteMapTheme(themedMap as never);
    expect(themedMap.setPaintProperty).toHaveBeenCalledTimes(1);
    expect(themedMap.setPaintProperty).toHaveBeenCalledWith("water", "fill-color", "#c9dfe7");
  });

  it("cleans up live route map resources as one lifecycle operation", () => {
    const container = document.createElement("div");
    container.inert = true;
    const marker = { remove: vi.fn() };
    const markers = new Map([
      ["item-1", { day: "2026-01-01", marker }],
    ]);
    const map = {
      getLayer: vi.fn(() => true),
      getSource: vi.fn(() => true),
      remove: vi.fn(),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
    };

    const cleaned = cleanupLiveRouteMap({
      container,
      map: map as never,
      markers: markers as never,
      sourceIds: ["trip-route-day-0"],
    });

    expect(marker.remove).toHaveBeenCalled();
    expect(markers.size).toBe(0);
    expect(map.removeLayer).toHaveBeenCalledWith("trip-route-day-0-line");
    expect(map.removeSource).toHaveBeenCalledWith("trip-route-day-0");
    expect(map.remove).toHaveBeenCalled();
    expect(container.inert).toBe(false);
    expect(cleaned).toEqual({ map: null, sourceIds: [] });
  });
});
