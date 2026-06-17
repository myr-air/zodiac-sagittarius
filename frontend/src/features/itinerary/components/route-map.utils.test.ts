import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { type ItineraryItem } from "@/src/trip/types";
import { hasCoordinates } from "@/src/features/itinerary/components/route-map.utils";
import {
  activeDayLabel,
  dayColorFor,
  fallbackRouteViewport,
  fitLiveRoute,
  getRouteCenter,
  applyRouteMapTheme,
} from "./route-map.utils";

describe("route map utilities", () => {
  it("builds route labels", () => {
    expect(activeDayLabel("all", [{ day: "2026-06-01", color: "#000", label: "วันที่ 1", points: [] }], "ทุกวัน", "เลือกวัน")).toBe("ทุกวัน");
    expect(activeDayLabel("missing-day", [{ day: "2026-06-01", color: "#000", label: "วันที่ 1", points: [] }], "ทุกวัน", "เลือกวัน")).toBe("เลือกวัน");
    expect(dayColorFor("missing-day", [])).toBe("#c24f16");
  });

  it("resolves viewport fallbacks consistently", () => {
    expect(fallbackRouteViewport("Hong Kong + Shenzhen", [])).toEqual({ center: [114.18, 22.39], zoom: 9.8 });
    expect(fallbackRouteViewport("Hong Kong", [])).toEqual({ center: [114.1694, 22.3193], zoom: 10 });
    expect(fallbackRouteViewport("เชียงใหม่, Thailand", ["Thailand"])).toEqual({ center: [100.9925, 15.87], zoom: 5 });
  });

  it("uses fallback center and supports live route fit transitions", () => {
    const map = { flyTo: vi.fn(), fitBounds: vi.fn() };
    fitLiveRoute(map as never, []);
    expect(map.flyTo).toHaveBeenCalledWith({ center: [100.9925, 15.87], essential: false, zoom: 5 });
    expect(map.fitBounds).not.toHaveBeenCalled();
  });

  it("computes route center when coordinates exist", () => {
    const withCoordinates = tripFixture.planItems.filter(
      (item): item is ItineraryItem & { coordinates: NonNullable<ItineraryItem["coordinates"]> } => Boolean(hasCoordinates(item.coordinates)),
    ).slice(0, 2).map((item) => ({
      ...item,
      coordinates: item.coordinates!,
    }));
    expect(getRouteCenter(withCoordinates.map((item) => ({ item, x: 0, y: 0 })))).toHaveLength(2);
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
});
