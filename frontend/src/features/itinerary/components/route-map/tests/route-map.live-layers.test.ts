import { describe, expect, it, vi } from "vitest";
import { routeMapCoordinateItems } from "../testing/fixtures/route-map-fixtures";
import { cleanupRouteLayers, synchronizeRouteLayers } from "../route-map.live-layers";
import { allDaysFilter } from "../route-map.types";

describe("route map live layer utilities", () => {
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
});
