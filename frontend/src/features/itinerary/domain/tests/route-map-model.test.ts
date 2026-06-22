import { describe, expect, it } from "vitest";
import {
  activeDayLabel,
  allDaysFilter,
  buildRouteDayGroups,
  buildRoutePoints,
  buildVisibleRouteMapState,
  dayColorFor,
  hasCoordinates,
} from "../route-map-model";
import { groupItemsByDay } from "@/src/trip/itinerary-core";
import {
  hongKongDay,
  routeMapItems,
  routeMapUnresolvedItems,
  tripDates,
} from "@/src/features/itinerary/components/route-map/testing/fixtures/route-map-fixtures";

describe("route map model", () => {
  it("builds route labels", () => {
    expect(activeDayLabel(allDaysFilter, [{ day: "2026-06-01", color: "#000", label: "วันที่ 1", points: [] }], "ทุกวัน", "เลือกวัน")).toBe("ทุกวัน");
    expect(activeDayLabel("missing-day", [{ day: "2026-06-01", color: "#000", label: "วันที่ 1", points: [] }], "ทุกวัน", "เลือกวัน")).toBe("เลือกวัน");
    expect(dayColorFor("missing-day", [])).toBe("#c24f16");
  });

  it("keeps duplicate fallback days on the same route lane", () => {
    const baseItem = routeMapItems[0]!;
    const points = buildRoutePoints([
      { ...baseItem, id: "day-a-first", day: "2026-06-19", coordinates: undefined },
      { ...baseItem, id: "day-b", day: "2026-06-20", coordinates: undefined },
      { ...baseItem, id: "day-a-second", day: "2026-06-19", coordinates: undefined },
    ]);

    expect(points.map((point) => [point.item.id, point.y])).toEqual([
      ["day-a-first", 22],
      ["day-b", 54],
      ["day-a-second", 22],
    ]);
  });

  it("builds visible route map state for all days with a capped unresolved batch", () => {
    const routePoints = buildRoutePoints(routeMapItems);
    const coordinateRoutePoints = routePoints.filter((point) =>
      hasCoordinates(point.item.coordinates),
    );
    const unresolvedItems = routeMapUnresolvedItems(4);
    const routeDayGroups = buildRouteDayGroups(
      groupItemsByDay(routeMapItems),
      coordinateRoutePoints,
      tripDates[0]!,
      "en",
    );

    const state = buildVisibleRouteMapState({
      activeDay: allDaysFilter,
      coordinateRoutePoints,
      liveRoutePoints: coordinateRoutePoints,
      maxAllDaysCoordinateResolutionBatch: 2,
      routeDayGroups,
      unresolvedItems,
    });

    expect(state.visibleRouteDayGroups).toHaveLength(routeDayGroups.length);
    expect(state.visibleRoutePoints).toHaveLength(coordinateRoutePoints.length);
    expect(state.visibleUnresolvedItems).toHaveLength(4);
    expect(state.coordinateResolutionBatch).toHaveLength(2);
    expect(state.visibleLiveRoutePoints).toHaveLength(coordinateRoutePoints.length);
  });

  it("builds visible route map state for one selected day without capping unresolved items", () => {
    const routePoints = buildRoutePoints(routeMapItems);
    const coordinateRoutePoints = routePoints.filter((point) =>
      hasCoordinates(point.item.coordinates),
    );
    const unresolvedItems = routeMapUnresolvedItems(4).map((item, index) => ({
      ...item,
      day: index === 0 ? tripDates[0]! : hongKongDay,
    }));
    const routeDayGroups = buildRouteDayGroups(
      groupItemsByDay(routeMapItems),
      coordinateRoutePoints,
      tripDates[0]!,
      "en",
    );

    const state = buildVisibleRouteMapState({
      activeDay: hongKongDay,
      coordinateRoutePoints,
      liveRoutePoints: coordinateRoutePoints,
      maxAllDaysCoordinateResolutionBatch: 1,
      routeDayGroups,
      unresolvedItems,
    });

    expect(state.visibleRouteDayGroups.map((group) => group.day)).toEqual([
      hongKongDay,
    ]);
    expect(state.visibleRoutePoints.every((point) => point.item.day === hongKongDay)).toBe(true);
    expect(state.visibleUnresolvedItems).toHaveLength(3);
    expect(state.coordinateResolutionBatch).toHaveLength(3);
    expect(state.visibleLiveRoutePoints).toEqual(state.visibleRoutePoints);
  });
});
