import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { hasValidCoordinates } from "./route-map-test-support";
import { cleanupRouteLayers, applyRouteMapTheme, fitLiveRoute, synchronizeRouteLayers } from "./route-map.live";

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
    const coordinateItems = tripFixture.planItems.filter(hasValidCoordinates).slice(0, 3);
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
    ], "all");

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
});
