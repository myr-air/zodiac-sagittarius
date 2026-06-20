import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  activeDayLabel,
  applyRouteMapTheme,
  dayColorFor,
  fallbackRouteViewport,
  fitLiveRoute,
  getRouteCenter,
  liveMapStatusText,
  RouteMapView,
} from "./RouteMapView";
import {
  hongKongDay,
  renderWithThaiI18n,
  routeMapCoordinateItems,
  routeMapItems,
  routeMapUnresolvedItems,
} from "./route-map-test-support";

describe("RouteMapView", () => {
  const render = renderWithThaiI18n;

  it("summarizes route visibility and filters stops by day", () => {
    const coordinateItems = routeMapCoordinateItems();
    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByRole("heading", { name: "แผนที่" })).toBeInTheDocument();
    expect(screen.getByText(/มีพิกัด/)).toHaveTextContent(
      `${coordinateItems.length}/${routeMapItems.length} มีพิกัด · 0 ยังไม่ระบุ`,
    );
    expect(screen.getByText("กำลังโหลดแผนที่จาก OpenFreeMap")).toBeInTheDocument();
    expect(screen.getByText("Hong Kong")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "จุดบนเส้นทางที่แสดงอยู่" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /วันที่ 2/ }));

    const dayTwoCount = coordinateItems.filter((item) => item.day === hongKongDay).length;
    expect(screen.getByText(/มีพิกัด/)).toHaveTextContent(
      `${dayTwoCount}/${routeMapItems.length} มีพิกัด · 0 ยังไม่ระบุ`,
    );
    expect(screen.getAllByText(/วันที่ 2/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "ทุกวัน" }));
    expect(screen.getByText(/มีพิกัด/)).toHaveTextContent(
      `${coordinateItems.length}/${routeMapItems.length} มีพิกัด · 0 ยังไม่ระบุ`,
    );
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

    expect(screen.getByText("0/0 มีพิกัด · 0 ยังไม่ระบุ")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /วันที่ 1/ })).not.toBeInTheDocument();
  });

  it("lists stops without coordinates instead of placing unresolved map markers", () => {
    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapUnresolvedItems(3)}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByText("0/3 มีพิกัด · 3 ยังไม่ระบุ")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "กิจกรรมที่ยังไม่มีพิกัด" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "หาพิกัด 3 จุด" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /วันที่ 1/ })).toBeInTheDocument();
    expect(screen.getByText("กำลังโหลดแผนที่จาก OpenFreeMap")).toBeInTheDocument();
  });

  it("requests coordinate resolution for visible unresolved stops", async () => {
    const user = userEvent.setup();
    const onResolveMissingCoordinates = vi.fn(() => ({
      attempted: 1,
      failed: 0,
      resolved: 1,
      skipped: 0,
    }));
    const unresolvedItems = routeMapUnresolvedItems(8);

    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={unresolvedItems}
        onResolveMissingCoordinates={onResolveMissingCoordinates}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await user.click(screen.getByRole("button", { name: /วันที่ 2/ }));
    await user.click(screen.getByRole("button", { name: "หาพิกัด 1 จุด" }));

    expect(onResolveMissingCoordinates).toHaveBeenCalledWith(unresolvedItems.filter((item) => item.day === hongKongDay));
    expect(screen.getByText("พบ 1/1 จุด · 0 จุดต้องตรวจต่อ")).toBeInTheDocument();
  });

  it("caps all-days coordinate lookup batches and explains the limit", async () => {
    const user = userEvent.setup();
    const onResolveMissingCoordinates = vi.fn(() => ({
      attempted: 8,
      failed: 1,
      resolved: 3,
      skipped: 4,
    }));
    const unresolvedItems = routeMapUnresolvedItems(10);

    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={unresolvedItems}
        onResolveMissingCoordinates={onResolveMissingCoordinates}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByRole("button", { name: "หาพิกัด 8 จุด" })).toBeInTheDocument();
    expect(screen.getByText("หาครั้งละ 8 จุดเพื่อไม่ให้ช้าเกินไป ยังเหลือ 10 จุด")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "หาพิกัด 8 จุด" }));

    expect(onResolveMissingCoordinates).toHaveBeenCalledWith(unresolvedItems.slice(0, 8));
    expect(screen.getByText("พบ 3/8 จุด · 5 จุดต้องตรวจต่อ")).toBeInTheDocument();
  });

  it("includes valid stops outside the previous longitude gate", () => {
    const londonStop = {
      ...routeMapItems[0],
      id: "manual-london-stop",
      day: "2026-06-18",
      sortOrder: 999,
      startTime: "10:30",
      place: "London Eye",
      activity: "London Stop",
      coordinates: { lat: 51.5074, lng: -0.1278 },
    };

    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={[routeMapItems[0], londonStop]}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByText("2/2 มีพิกัด · 0 ยังไม่ระบุ")).toBeInTheDocument();
    expect(screen.getByText("กำลังโหลดแผนที่จาก OpenFreeMap")).toBeInTheDocument();
  });

  it("exercises route map helper fallbacks directly", () => {
    expect(liveMapStatusText("error", "กำลังโหลด", "โหลดไม่สำเร็จ")).toBe("โหลดไม่สำเร็จ");
    expect(activeDayLabel("missing-day", [], "ทุกวัน", "เลือกวัน")).toBe("เลือกวัน");
    expect(dayColorFor("missing-day", [])).toBe("#c24f16");

    const map = { flyTo: vi.fn(), fitBounds: vi.fn() };
    fitLiveRoute(map as never, []);
    expect(map.flyTo).toHaveBeenCalledWith({ center: [100.9925, 15.87], essential: false, zoom: 5 });
    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(getRouteCenter([])).toEqual([100.9925, 15.87]);
    expect(fallbackRouteViewport("Hong Kong + Shenzhen", [])).toEqual({ center: [114.18, 22.39], zoom: 9.8 });
    expect(fallbackRouteViewport("Hong Kong", [])).toEqual({ center: [114.1694, 22.3193], zoom: 10 });
    expect(fallbackRouteViewport("", [])).toEqual({ center: [100.9925, 15.87], zoom: 5 });

    const themedMap = {
      getLayer: vi.fn((layerId: string) => layerId === "water"),
      setPaintProperty: vi.fn(),
    };
    applyRouteMapTheme(themedMap as never);
    expect(themedMap.setPaintProperty).toHaveBeenCalledTimes(1);
    expect(themedMap.setPaintProperty).toHaveBeenCalledWith("water", "fill-color", "#c9dfe7");

  });
});
