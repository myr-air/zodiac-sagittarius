import { describe, expect, it } from "vitest";
import {
  activeDayLabel,
  dayColorFor,
} from "./route-map.utils";

describe("route map utilities", () => {
  it("builds route labels", () => {
    expect(activeDayLabel("all", [{ day: "2026-06-01", color: "#000", label: "วันที่ 1", points: [] }], "ทุกวัน", "เลือกวัน")).toBe("ทุกวัน");
    expect(activeDayLabel("missing-day", [{ day: "2026-06-01", color: "#000", label: "วันที่ 1", points: [] }], "ทุกวัน", "เลือกวัน")).toBe("เลือกวัน");
    expect(dayColorFor("missing-day", [])).toBe("#c24f16");
  });

});
