import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/demo/trip-fixtures";
import {
  activeDayLabel,
  dayColorFor,
  fitLiveRoute,
  getRouteCenter,
  liveMapStatusText,
  RouteMapView,
} from "./RouteMapView";

const maplibreMock = vi.hoisted(() => ({
  maps: [] as Array<{
    addControl: ReturnType<typeof vi.fn>;
    addLayer: ReturnType<typeof vi.fn>;
    addSource: ReturnType<typeof vi.fn>;
    fitBounds: ReturnType<typeof vi.fn>;
    flyTo: ReturnType<typeof vi.fn>;
    getLayer: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    setPaintProperty: ReturnType<typeof vi.fn>;
  }>,
  markers: [] as Array<{ element: HTMLElement; remove: ReturnType<typeof vi.fn> }>,
  loadDelay: 0,
  throwOnCreate: false,
}));

vi.mock("maplibre-gl", () => ({
  Map: vi.fn().mockImplementation(function (options: { container: HTMLElement }) {
    if (maplibreMock.throwOnCreate) throw new Error("map failed");
    const handlers = new Map<string, () => void>();
    const map = {
      addControl: vi.fn(),
      addLayer: vi.fn(),
      addSource: vi.fn(),
      fitBounds: vi.fn(),
      flyTo: vi.fn(),
      getLayer: vi.fn(() => true),
      on: vi.fn((event: string, callback: () => void) => {
        handlers.set(event, callback);
        if (event === "load") window.setTimeout(callback, maplibreMock.loadDelay);
      }),
      remove: vi.fn(),
      setPaintProperty: vi.fn(),
    };
    const chromeButton = document.createElement("button");
    options.container.append(chromeButton);
    Object.assign(map, { trigger: (event: string) => handlers.get(event)?.() });
    maplibreMock.maps.push(map);
    return map;
  }),
  Marker: vi.fn().mockImplementation(function ({ element }: { element: HTMLElement }) {
    const marker = {
      element,
      addTo: vi.fn(() => marker),
      getElement: () => element,
      remove: vi.fn(),
      setLngLat: vi.fn(() => marker),
    };
    maplibreMock.markers.push(marker);
    return marker;
  }),
  NavigationControl: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

describe("RouteMapView", () => {
  afterEach(() => {
    maplibreMock.maps.length = 0;
    maplibreMock.markers.length = 0;
    maplibreMock.loadDelay = 0;
    maplibreMock.throwOnCreate = false;
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("summarizes route visibility and filters stops by day", async () => {
    const regionalItems = tripFixture.planItems.filter((item) => !item.coordinates || item.coordinates.lng > 110);
    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={tripFixture.planItems}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByRole("heading", { name: "แผนที่" })).toBeInTheDocument();
    expect(screen.getByText(/stops visible/)).toHaveTextContent(`${regionalItems.length}/${regionalItems.length} stops visible`);
    expect(screen.getByText("กำลังโหลดแผนที่จาก OpenFreeMap")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Day 2/ }));

    const dayTwoCount = regionalItems.filter((item) => item.day === "2025-05-16").length;
    expect(screen.getByText(/stops visible/)).toHaveTextContent(`${dayTwoCount}/${regionalItems.length} stops visible`);
    expect(screen.getAllByText(/Day 2/).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "ทุกวัน" }));
    expect(screen.getByText(/stops visible/)).toHaveTextContent(`${regionalItems.length}/${regionalItems.length} stops visible`);
  });

  it("handles empty route data without map day choices", () => {
    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={[]}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByText("0/0 stops visible")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Day 1/ })).not.toBeInTheDocument();
  });

  it("projects stops without coordinates onto fallback route points", () => {
    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={tripFixture.planItems.slice(0, 3).map((item) => ({ ...item, coordinates: undefined }))}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByText("3/3 stops visible")).toBeInTheDocument();
    expect(screen.getByText("กำลังโหลดแผนที่จาก OpenFreeMap")).toBeInTheDocument();
  });

  it("centers a live map around one coordinate with a fly-to transition", async () => {
    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={[tripFixture.planItems.find((item) => item.coordinates && item.coordinates.lng > 110)!]}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await waitFor(() => expect(maplibreMock.maps[0]?.flyTo).toHaveBeenCalled());
  });

  it("renders the fallback route diagram when the live map fails", async () => {
    maplibreMock.throwOnCreate = true;

    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={tripFixture.planItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await waitFor(() => expect(screen.getByText("Hong Kong")).toBeInTheDocument());
    expect(screen.getByText("Shenzhen")).toBeInTheDocument();
    expect(screen.getByText("Victoria Harbour")).toBeInTheDocument();
  });

  it("mounts, filters, and cleans up a live MapLibre route", async () => {
    const { unmount } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={tripFixture.planItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await waitFor(() => expect(maplibreMock.maps[0]?.addLayer).toHaveBeenCalled());
    expect(document.querySelector(".route-live-map button")).toHaveAttribute("tabindex", "-1");
    expect(maplibreMock.markers.length).toBeGreaterThan(1);

    await userEvent.click(screen.getByRole("button", { name: /Day 2/ }));

    expect(maplibreMock.maps[0]?.setPaintProperty).toHaveBeenCalled();
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
        items={tripFixture.planItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await vi.dynamicImportSettled();
    fireEvent.click(screen.getByRole("button", { name: /Day 2/ }));

    await waitFor(() => expect(maplibreMock.maps[0]?.fitBounds).toHaveBeenCalled());
  });

  it("handles live map error events and ignores late load callbacks after cleanup", async () => {
    const { unmount } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={tripFixture.planItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );
    await waitFor(() => expect(maplibreMock.maps[0]).toBeTruthy());

    (maplibreMock.maps[0] as typeof maplibreMock.maps[number] & { trigger: (event: string) => void }).trigger("error");
    await waitFor(() => expect(screen.getByText("Hong Kong")).toBeInTheDocument());

    unmount();
    expect(maplibreMock.maps[0]?.remove).toHaveBeenCalled();
  });

  it("ignores live map events after unmount and tolerates missing route layers", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={tripFixture.planItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );
    await waitFor(() => expect(maplibreMock.maps[0]).toBeTruthy());
    maplibreMock.maps[0]!.getLayer.mockReturnValue(false);

    await user.click(screen.getByRole("button", { name: /Day 2/ }));

    expect(maplibreMock.maps[0]!.setPaintProperty).not.toHaveBeenCalled();

    unmount();
    (maplibreMock.maps[0] as typeof maplibreMock.maps[number] & { trigger: (event: string) => void }).trigger("error");
    expect(screen.queryByText("Hong Kong")).not.toBeInTheDocument();
  });

  it("cleans up before async map mounting captures a container", () => {
    const { unmount } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={tripFixture.planItems}
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
        items={tripFixture.planItems.slice(0, 2)}
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
    const coordinateItems = tripFixture.planItems.filter((item) => item.day === "2025-05-16" && item.coordinates).slice(0, 2);
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

  it("exercises route map helper fallbacks directly", () => {
    expect(liveMapStatusText("error")).toBe("โหลดแผนที่สดไม่สำเร็จ แสดงแผนผังสำรองไว้ก่อน");
    expect(activeDayLabel("missing-day", [])).toBe("เลือกวัน");
    expect(dayColorFor("missing-day", [])).toBe("#2563eb");

    const map = { flyTo: vi.fn(), fitBounds: vi.fn() };
    fitLiveRoute(map as never, []);
    expect(map.flyTo).not.toHaveBeenCalled();
    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(getRouteCenter([])).toEqual([114.16, 22.3]);
  });
});
