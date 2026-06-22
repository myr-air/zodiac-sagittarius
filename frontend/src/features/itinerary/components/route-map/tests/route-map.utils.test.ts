import { describe, expect, it } from "vitest";
import { allDaysFilter } from "../route-map.types";
import {
  activeDayLabel,
  buildRoutePoints,
  dayColorFor,
} from "../route-map.utils";
import { routeMapItems } from "../testing/fixtures/route-map-fixtures";

describe("route map utilities", () => {
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
});
