import { describe, expect, it, vi } from "vitest";
import { routeMapCoordinateItems } from "../testing/fixtures/route-map-fixtures";
import { allDaysFilter } from "../route-map.types";
import {
  applyRouteMapTheme,
  cleanupLiveRouteMap,
  cleanupRouteLayers,
  fitLiveRoute,
  synchronizeRouteLayers,
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

  it("synchronizes live route line layers by day", () => {
    const coordinateItems = routeMapCoordinateItems().slice(0, 3);
    const map = {
      addLayer: vi.fn(),
      addSource: vi.fn(),
      getLayer: vi.fn(),
      getSource: vi.fn(),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
    };

    const sourceIds = synchronizeRouteLayers(map as never, [], [
      {
        color: "#c24f16",
        day: coordinateItems[0]!.day,
        label: "Day 1",
        points: coordinateItems.map((item, index) => ({ item, x: index, y: index })),
      },
    ], allDaysFilter);

    expect(sourceIds).toEqual(["trip-route-day-0"]);
    expect(map.addSource).toHaveBeenCalledWith("trip-route-day-0", expect.objectContaining({ type: "geojson" }));
    expect(map.addLayer).toHaveBeenCalledTimes(2);
  });

  it("cleans up live route layers before removing sources", () => {
    const map = {
      getLayer: vi.fn(() => true),
      getSource: vi.fn(() => true),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
    };

    cleanupRouteLayers(map as never, ["trip-route-day-0"]);

    expect(map.removeLayer).toHaveBeenNthCalledWith(1, "trip-route-day-0-line");
    expect(map.removeLayer).toHaveBeenNthCalledWith(2, "trip-route-day-0-shadow");
    expect(map.removeSource).toHaveBeenCalledWith("trip-route-day-0");
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
