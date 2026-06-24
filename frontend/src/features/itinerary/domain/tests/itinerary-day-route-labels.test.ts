import { describe, expect, it } from "vitest";
import { dayRouteLabel } from "../itinerary-day-route-labels";

describe("itinerary day route labels", () => {
  it("uses explicit travel arrows from day item places", () => {
    expect(
      dayRouteLabel("2026-06-18", "en", [
        { place: "Bangkok → Hong Kong" },
        { place: "Hong Kong International Airport" },
      ]),
    ).toBe("Bangkok -> Hong Kong");
    expect(
      dayRouteLabel("2026-06-18", "en", [{ place: "Hong Kong -> Shenzhen" }]),
    ).toBe("Hong Kong -> Shenzhen");
  });

  it("summarizes a day from its first and last distinct places", () => {
    expect(
      dayRouteLabel("2026-06-19", "en", [
        { place: "The Elements" },
        { place: "The Elements" },
        { place: "Central" },
      ]),
    ).toBe("The Elements -> Central");
  });

  it("falls back when the day has no useful places", () => {
    expect(dayRouteLabel("2026-06-20", "en", [])).toBe("Trip day");
    expect(dayRouteLabel("2026-06-20", "th", [{ place: "   " }])).toBe(
      "วันในทริป",
    );
  });
});
