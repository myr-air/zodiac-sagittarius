import { waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  getMaplibreMock,
  resetMaplibreMock,
} from "./route-map-live-map-test-support";
import { renderLiveRouteMap } from "./route-map-live-map-view-test-support";
import {
  hongKongDay,
  routeMapDayCoordinateItems,
  routeMapItems,
} from "./route-map-test-support";
import { RouteMapView } from "./RouteMapView";

const maplibreMock = getMaplibreMock();

describe("RouteMapView live map lifecycle", () => {
  afterEach(() => {
    resetMaplibreMock();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("rebuilds live map lines when points change after mount", async () => {
    const { rerender } = renderLiveRouteMap({ items: routeMapItems.slice(0, 2) });

    await waitFor(() => expect(maplibreMock.maps[0]?.addLayer).toHaveBeenCalled());

    const map = maplibreMock.maps[0] as typeof maplibreMock.maps[number];
    map.removeLayer.mockClear();
    map.removeSource.mockClear();
    map.addLayer.mockClear();
    map.addSource.mockClear();

    rerender(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems.slice(0, 3)}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await waitFor(() => expect(map.removeLayer).toHaveBeenCalled());
    await waitFor(() => expect(map.addSource).toHaveBeenCalled());
    expect(map.removeSource).toHaveBeenCalled();
  });

  it("cleans up before async map mounting captures a container", () => {
    const { unmount } = renderLiveRouteMap();

    unmount();

    expect(maplibreMock.maps).toHaveLength(0);
  });

  it("ignores late live map load callbacks after cleanup", async () => {
    maplibreMock.loadDelay = 50;
    vi.useFakeTimers();
    const { unmount } = renderLiveRouteMap({ items: routeMapItems.slice(0, 2) });
    await vi.dynamicImportSettled();
    expect(maplibreMock.maps.at(-1)).toBeTruthy();
    unmount();
    vi.advanceTimersByTime(60);

    expect(maplibreMock.maps.at(-1)?.remove).toHaveBeenCalled();
    expect(maplibreMock.maps.at(-1)?.addLayer).not.toHaveBeenCalled();
  });

  it("builds live map lines from mixed coordinate and fallback points", async () => {
    const coordinateItems = routeMapDayCoordinateItems(hongKongDay, 2);
    const mixedItems = [
      coordinateItems[0],
      { ...coordinateItems[0], id: "fallback-middle-stop", activity: "Fallback middle", coordinates: undefined },
      coordinateItems[1],
    ];

    renderLiveRouteMap({ items: mixedItems });

    await waitFor(() => expect(maplibreMock.maps[0]?.addSource).toHaveBeenCalled());
    expect(maplibreMock.maps[0]?.addSource).toHaveBeenCalledWith(
      "trip-route-day-0",
      expect.objectContaining({
        data: expect.objectContaining({
          geometry: expect.objectContaining({
            coordinates: coordinateItems.map((item) => [item.coordinates!.lng, item.coordinates!.lat]),
          }),
        }),
      }),
    );
  });
});
