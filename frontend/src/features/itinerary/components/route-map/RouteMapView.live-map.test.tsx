import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { RouteMapView } from "./RouteMapView";
import { renderWithThaiI18n, hongKongDay } from "./route-map-test-support";

const maplibreMock = vi.hoisted(() => ({
  maps: [] as Array<{
    addControl: ReturnType<typeof vi.fn>;
    addLayer: ReturnType<typeof vi.fn>;
    addSource: ReturnType<typeof vi.fn>;
    getSource: ReturnType<typeof vi.fn>;
    fitBounds: ReturnType<typeof vi.fn>;
    flyTo: ReturnType<typeof vi.fn>;
    getLayer: ReturnType<typeof vi.fn>;
    removeLayer: ReturnType<typeof vi.fn>;
    removeSource: ReturnType<typeof vi.fn>;
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
      getSource: vi.fn(() => ({ type: "geojson" })),
      fitBounds: vi.fn(),
      flyTo: vi.fn(),
      getLayer: vi.fn(() => true),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
      remove: vi.fn(),
      setPaintProperty: vi.fn(),
      on: vi.fn((event: string, callback: () => void) => {
        handlers.set(event, callback);
        if (event === "load") window.setTimeout(callback, maplibreMock.loadDelay);
      }),
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

describe("RouteMapView live map", () => {
  const render = renderWithThaiI18n;

  afterEach(() => {
    maplibreMock.maps.length = 0;
    maplibreMock.markers.length = 0;
    maplibreMock.loadDelay = 0;
    maplibreMock.throwOnCreate = false;
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("centers the live map on the destination country when no stop has coordinates", async () => {
    const unresolvedItems = tripFixture.planItems.slice(0, 2).map((item) => ({ ...item, coordinates: undefined }));
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
    expect(screen.getByRole("status")).toHaveTextContent("โหลดแผนที่สดไม่สำเร็จ แสดงแผนผังสำรองไว้ก่อน");
    expect(screen.getByRole("button", { name: "ลองโหลดแผนที่สดอีกครั้ง" })).toBeInTheDocument();
    expect(screen.getByText("Shenzhen")).toBeInTheDocument();
    expect(screen.getByText("Victoria Harbour")).toBeInTheDocument();
  });

  it("can preview live map loading and failure states without mounting MapLibre", () => {
    const { rerender } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={tripFixture.planItems}
        liveMapAvailability="loading"
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByLabelText(/ตัวอย่างแผนที่เส้นทางฮ่องกงและเซินเจิ้น/i)).toHaveAttribute("data-live-map-state", "loading");
    expect(screen.getByText("กำลังโหลดแผนที่จาก OpenFreeMap")).toHaveClass("route-map-status");
    expect(maplibreMock.maps).toHaveLength(0);

    rerender(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={tripFixture.planItems}
        liveMapAvailability="error"
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("โหลดแผนที่สดไม่สำเร็จ แสดงแผนผังสำรองไว้ก่อน");
    expect(screen.queryByRole("button", { name: "ลองโหลดแผนที่สดอีกครั้ง" })).not.toBeInTheDocument();
    expect(screen.getByText("Hong Kong")).toBeInTheDocument();
    expect(maplibreMock.maps).toHaveLength(0);
  });

  it("retries the live map after a tile failure remounts MapLibre", async () => {
    const user = userEvent.setup();

    render(
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
    await waitFor(() => expect(screen.getByRole("button", { name: "ลองโหลดแผนที่สดอีกครั้ง" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "ลองโหลดแผนที่สดอีกครั้ง" }));

    await waitFor(() => expect(maplibreMock.maps).toHaveLength(2));
    await waitFor(() => expect(maplibreMock.maps[1]?.addLayer).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "ลองโหลดแผนที่สดอีกครั้ง" })).not.toBeInTheDocument();
  });

  it("exposes hybrid Tailwind bridge classes for the map shell and fallback surface", async () => {
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

    const panel = screen.getByRole("region", { name: /แผนที่เส้นทาง/i });
    expect(panel).toHaveClass("route-map-panel", "grid", "min-h-0");

    expect(document.querySelector(".route-map-layout")).toHaveClass(
      "route-map-layout",
      "h-full",
      "min-h-0",
      "bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)]",
    );
    const canvas = screen.getByLabelText(/ตัวอย่างแผนที่เส้นทางฮ่องกงและเซินเจิ้น/i);
    expect(canvas).toHaveClass(
      "route-map-canvas",
      "relative",
      "min-h-[560px]",
      "overflow-hidden",
      "bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)]",
    );
    expect(canvas.className).not.toContain("radial-gradient");
    expect(canvas).toHaveAttribute("data-live-map-state", "error");

    const dayTwoButton = screen.getByRole("button", { name: /วันที่ 2/i });
    expect(dayTwoButton).toHaveClass("map-day-filter-button", "inline-flex", "bg-[rgb(255_255_255_/_0.78)]");
    expect(screen.getByText("Hong Kong")).toHaveClass("map-zone", "absolute", "bg-[rgb(255_255_255_/_0.82)]");
    expect(document.querySelector(".route-map-svg")).toHaveClass("route-map-svg", "absolute", "inset-0");
    expect(document.querySelector(".route-marker")).toHaveClass("route-marker", "absolute", "grid");
    expect(screen.getByText(/OpenFreeMap/i)).toHaveClass("map-source-note", "absolute", "bg-[rgb(255_255_255_/_0.86)]");
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
        items={tripFixture.planItems}
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
        items={tripFixture.planItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );
    await waitFor(() => expect(maplibreMock.maps[0]).toBeTruthy());

    (maplibreMock.maps[0] as typeof maplibreMock.maps[number] & { trigger: (event: string) => void }).trigger("error");
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
        items={tripFixture.planItems}
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
    (maplibreMock.maps[0] as typeof maplibreMock.maps[number] & { trigger: (event: string) => void }).trigger("error");
    expect(screen.queryByText("Hong Kong")).not.toBeInTheDocument();
  });

  it("rebuilds live map lines when points change after mount", async () => {
    const { rerender } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={tripFixture.planItems.slice(0, 2)}
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
        items={tripFixture.planItems.slice(0, 3)}
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
    const coordinateItems = tripFixture.planItems.filter((item) => item.day === hongKongDay && item.coordinates).slice(0, 2);
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
