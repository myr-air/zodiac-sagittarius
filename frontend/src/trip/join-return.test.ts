import { describe, expect, it } from "vitest";
import { resolveJoinPostAuthReturnTo } from "@/src/trip/join-return";

describe("join return routes", () => {
  it("only accepts safe post-auth return targets", () => {
    const tripId = "018f4e80-5788-7de0-a45c-8a555d17fc2d";

    expect(resolveJoinPostAuthReturnTo("/trips", tripId)).toBeNull();
    expect(
      resolveJoinPostAuthReturnTo(`/trips/${tripId}/itinerary`, tripId),
    ).toBe(`/trips/${tripId}/itinerary`);
    expect(resolveJoinPostAuthReturnTo(`/trips/${tripId}?foo=1`, tripId)).toBe(
      `/trips/${tripId}?foo=1`,
    );
    expect(
      resolveJoinPostAuthReturnTo(
        `/trips/018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99/members`,
        tripId,
      ),
    ).toBeNull();
    expect(resolveJoinPostAuthReturnTo("/settings", tripId)).toBe("/settings");
    expect(
      resolveJoinPostAuthReturnTo(
        "/trips/AY9OgFeIfeCkXIpVXRf8LQ/itinerary",
        tripId,
      ),
    ).toBe("/trips/AY9OgFeIfeCkXIpVXRf8LQ/itinerary");
  });
});
