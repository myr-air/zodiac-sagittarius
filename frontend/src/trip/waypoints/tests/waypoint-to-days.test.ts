import { describe, it, expect } from "vitest";
import { convertWaypointsToDays } from "../waypoint-to-days";
import type { Waypoint } from "../waypoint-types";

function makeWp(overrides: Partial<Waypoint> & { id: string; sortOrder: number }): Waypoint {
  return {
    tripId: "trip-1",
    name: `WP-${overrides.id}`,
    lat: 35.6762,
    lng: 139.6503, // Tokyo
    ...overrides,
  };
}

describe("convertWaypointsToDays", () => {
  it("returns empty array for no waypoints", () => {
    expect(convertWaypointsToDays([], "2027-03-01")).toEqual([]);
  });

  it("converts single waypoint to one day group", () => {
    const wps = [makeWp({ id: "1", sortOrder: 1 })];
    const result = convertWaypointsToDays(wps, "2027-03-01");
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2027-03-01");
    expect(result[0].label).toBe("Day 1");
    expect(result[0].waypoints).toHaveLength(1);
  });

  it("converts 6 waypoints into 6 individual days when far apart", () => {
    const wps = Array.from({ length: 6 }, (_, i) =>
      makeWp({ id: String(i + 1), sortOrder: i + 1, lat: 35 + i * 10, lng: 139 + i * 10 }),
    );
    const result = convertWaypointsToDays(wps, "2027-03-01");
    expect(result).toHaveLength(6);
    // Days increment
    expect(result[0].date).toBe("2027-03-01");
    expect(result[1].date).toBe("2027-03-02");
    expect(result[5].date).toBe("2027-03-06");
  });

  it("merges waypoints within 50km into same day group", () => {
    // Two waypoints very close together (< 1km) in Tokyo
    const wps = [
      makeWp({ id: "1", sortOrder: 1, lat: 35.6762, lng: 139.6503 }),
      makeWp({ id: "2", sortOrder: 2, lat: 35.68, lng: 139.655 }), // ~1km away
      makeWp({ id: "3", sortOrder: 3, lat: 34.6937, lng: 135.5023 }), // Osaka (~400km away)
    ];
    const result = convertWaypointsToDays(wps, "2027-03-01");
    expect(result).toHaveLength(2); // Tokyo group + Osaka
    expect(result[0].waypoints).toHaveLength(2); // Two Tokyo waypoints merged
    expect(result[1].waypoints).toHaveLength(1); // Osaka alone
  });

  it("does not mutate original waypoints array", () => {
    const original = [makeWp({ id: "1", sortOrder: 1 })];
    const copy = [...original];
    convertWaypointsToDays(original, "2027-03-01");
    expect(original).toEqual(copy);
  });

  it("preserves waypoints within each group sorted by sortOrder", () => {
    const wps = [
      makeWp({ id: "2", sortOrder: 2, lat: 35.68, lng: 139.65 }),
      makeWp({ id: "1", sortOrder: 1, lat: 35.67, lng: 139.65 }),
    ];
    const result = convertWaypointsToDays(wps, "2027-03-01");
    expect(result[0].waypoints[0].sortOrder).toBe(1);
    expect(result[0].waypoints[1].sortOrder).toBe(2);
  });

  it("handles edge case: all waypoints within 50km", () => {
    const wps = Array.from({ length: 5 }, (_, i) =>
      makeWp({ id: String(i), sortOrder: i, lat: 35.67 + i * 0.001, lng: 139.65 }),
    );
    const result = convertWaypointsToDays(wps, "2027-03-01");
    expect(result).toHaveLength(1); // All merged
    expect(result[0].waypoints).toHaveLength(5);
  });
});
