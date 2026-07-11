import { describe, it, expect } from "vitest";
import type { Waypoint, WaypointCreateInput } from "../waypoint-types";

describe("Waypoint types", () => {
  it("Waypoint has the required shape", () => {
    const waypoint = {
      id: "wp-1",
      tripId: "trip-1",
      name: "Bangkok",
      lat: 13.7563,
      lng: 100.5018,
      sortOrder: 1,
      category: "city",
    } satisfies Waypoint;

    expect(waypoint.id).toBe("wp-1");
    expect(waypoint.tripId).toBe("trip-1");
    expect(waypoint.name).toBe("Bangkok");
    expect(typeof waypoint.lat).toBe("number");
    expect(typeof waypoint.lng).toBe("number");
    expect(waypoint.sortOrder).toBe(1);
    expect(waypoint.category).toBe("city");
  });

  it("WaypointCreateInput has the required shape", () => {
    const input = {
      tripId: "trip-1",
      name: "Chiang Mai",
      lat: 18.7883,
      lng: 98.9853,
      sortOrder: 2,
      category: undefined,
    } satisfies WaypointCreateInput;

    expect(input.tripId).toBe("trip-1");
    expect(input.name).toBe("Chiang Mai");
    expect(typeof input.lat).toBe("number");
    expect(typeof input.lng).toBe("number");
    expect(input.sortOrder).toBe(2);
    expect(input.category).toBeUndefined();
  });
});
