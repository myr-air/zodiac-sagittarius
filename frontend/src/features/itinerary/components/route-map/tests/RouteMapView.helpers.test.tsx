import { screen } from "@testing-library/react";
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
} from "../RouteMapView";
import {
  renderWithThaiI18n,
  routeMapItems,
} from "../testing/route-map-test-support";

describe("RouteMapView helpers", () => {
  const render = renderWithThaiI18n;

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
    expect(map.flyTo).toHaveBeenCalledWith({
      center: [100.9925, 15.87],
      essential: false,
      zoom: 5,
    });
    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(getRouteCenter([])).toEqual([100.9925, 15.87]);
    expect(fallbackRouteViewport("Hong Kong + Shenzhen", [])).toEqual({
      center: [114.18, 22.39],
      zoom: 9.8,
    });
    expect(fallbackRouteViewport("Hong Kong", [])).toEqual({
      center: [114.1694, 22.3193],
      zoom: 10,
    });
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
