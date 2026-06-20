import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  getMaplibreMock,
  resetMaplibreMock,
  triggerLiveMapEvent,
} from "./route-map-live-map-test-support";
import {
  hongKongDay,
  renderWithThaiI18n,
  routeMapDayCoordinateItems,
  routeMapItems,
  routeMapUnresolvedItems,
} from "./route-map-test-support";
import { RouteMapView } from "./RouteMapView";

const maplibreMock = getMaplibreMock();

describe("RouteMapView live map", () => {
  const render = renderWithThaiI18n;

  afterEach(() => {
    resetMaplibreMock();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("centers the live map on the destination country when no stop has coordinates", async () => {
    const unresolvedItems = routeMapUnresolvedItems(2);
    render(
      <RouteMapView
        countries={["Thailand"]}
        destinationLabel="Chiang Mai, Thailand"
        endDate={tripFixture.trip.endDate}
        items={unresolvedItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await waitFor(() => expect(maplibreMock.maps[0]?.flyTo).toHaveBeenCalledWith({
      center: [100.9925, 15.87],
      essential: false,
      zoom: 5,
    }));
  });

  it("centers a live map around one coordinate with a fly-to transition", async () => {
    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={[routeMapItems.find((item) => item.coordinates && item.coordinates.lng > 110)!]}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await waitFor(() => expect(maplibreMock.maps[0]?.flyTo).toHaveBeenCalled());
  });

  it("mounts, filters, and cleans up a live MapLibre route", async () => {
    const { unmount } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await waitFor(() => expect(maplibreMock.maps[0]?.addLayer).toHaveBeenCalled());
    expect(maplibreMock.maps[0]?.setPaintProperty).toHaveBeenCalledWith("water", "fill-color", "#c9dfe7");
    expect(maplibreMock.maps[0]?.setPaintProperty).toHaveBeenCalledWith("background", "background-color", "#f6fbfd");
    expect(maplibreMock.maps[0]?.setPaintProperty).toHaveBeenCalledWith("label_country_1", "text-color", "#0f3f46");
    expect(document.querySelector(".route-live-map")).not.toHaveProperty("inert", true);
    expect(document.querySelector(".route-live-map")).not.toHaveAttribute("tabindex");
    expect(document.querySelector(".route-live-map button")).toHaveAttribute("tabindex", "-1");
    expect(maplibreMock.markers.length).toBeGreaterThan(1);

    await userEvent.click(screen.getByRole("button", { name: /วันที่ 2/ }));

    expect(maplibreMock.maps[0]?.removeLayer).toHaveBeenCalled();
    expect(maplibreMock.maps[0]?.addLayer).toHaveBeenCalled();
    expect(maplibreMock.maps[0]?.fitBounds).toHaveBeenCalled();
    expect(maplibreMock.markers.some((marker) => marker.element.style.display === "none")).toBe(true);

    unmount();

    expect(maplibreMock.maps[0]?.remove).toHaveBeenCalled();
    expect(maplibreMock.markers.every((marker) => marker.remove.mock.calls.length > 0)).toBe(true);
  });

  it("fits a filtered live route when the active day changes before map load", async () => {
    maplibreMock.loadDelay = 10;
    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await vi.dynamicImportSettled();
    fireEvent.click(screen.getByRole("button", { name: /วันที่ 2/ }));

    await waitFor(() => expect(maplibreMock.maps[0]?.fitBounds).toHaveBeenCalled());
  });

  it("handles live map error events and ignores late load callbacks after cleanup", async () => {
    const { unmount } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );
    await waitFor(() => expect(maplibreMock.maps[0]).toBeTruthy());

    triggerLiveMapEvent(maplibreMock.maps[0], "error");
    await waitFor(() => expect(screen.getByText("Hong Kong")).toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("โหลดแผนที่สดไม่สำเร็จ แสดงแผนผังสำรองไว้ก่อน");

    unmount();
    expect(maplibreMock.maps[0]?.remove).toHaveBeenCalled();
  });

  it("ignores live map events after unmount and tolerates missing route layers", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );
    await waitFor(() => expect(maplibreMock.maps[0]).toBeTruthy());
    maplibreMock.maps[0]!.getLayer.mockReturnValue(false);

    await user.click(screen.getByRole("button", { name: /วันที่ 2/ }));

    expect(maplibreMock.maps[0]!.removeLayer).not.toHaveBeenCalled();

    unmount();
    triggerLiveMapEvent(maplibreMock.maps[0], "error");
    expect(screen.queryByText("Hong Kong")).not.toBeInTheDocument();
  });

  it("rebuilds live map lines when points change after mount", async () => {
    const { rerender } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems.slice(0, 2)}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

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
    const { unmount } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    unmount();

    expect(maplibreMock.maps).toHaveLength(0);
  });

  it("ignores late live map load callbacks after cleanup", async () => {
    maplibreMock.loadDelay = 50;
    vi.useFakeTimers();
    const { unmount } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems.slice(0, 2)}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );
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

    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={mixedItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

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
