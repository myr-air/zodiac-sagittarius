import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { hasCoordinates } from "./route-map.utils";
import {
  fallbackRouteViewport,
  getRouteCenter,
} from "./route-map.viewport";

describe("route map viewport helpers", () => {
  it("resolves viewport fallbacks consistently", () => {
    expect(fallbackRouteViewport("Hong Kong + Shenzhen", [])).toEqual({ center: [114.18, 22.39], zoom: 9.8 });
    expect(fallbackRouteViewport("Hong Kong", [])).toEqual({ center: [114.1694, 22.3193], zoom: 10 });
    expect(fallbackRouteViewport("เชียงใหม่, Thailand", ["Thailand"])).toEqual({ center: [100.9925, 15.87], zoom: 5 });
  });

  it("computes route center when coordinates exist", () => {
    const withCoordinates = tripFixture.planItems
      .filter(
        (item): item is ItineraryItem & { coordinates: NonNullable<ItineraryItem["coordinates"]> } =>
          Boolean(hasCoordinates(item.coordinates)),
      )
      .slice(0, 2)
      .map((item) => ({
        ...item,
        coordinates: item.coordinates!,
      }));
    expect(getRouteCenter(withCoordinates.map((item) => ({ item, x: 0, y: 0 })))).toHaveLength(2);
  });
});
