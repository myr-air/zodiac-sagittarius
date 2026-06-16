import { describe, expect, it } from "vitest";
import { appRoutes } from "@/src/routes/app-routes";
import { resolveJoinPostAuthReturnTo } from "@/src/trip/join-return";

describe("join return routes", () => {
  it("only accepts safe post-auth return targets", () => {
    const tripId = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
    const anotherTripId = "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99";

    expect(resolveJoinPostAuthReturnTo(appRoutes.trips(), tripId)).toBeNull();
    expect(
      resolveJoinPostAuthReturnTo(appRoutes.tripItinerary(tripId), tripId),
    ).toBe(appRoutes.tripItinerary(tripId));
    expect(
      resolveJoinPostAuthReturnTo(
        `${appRoutes.tripOverview(tripId)}?foo=1`,
        tripId,
      ),
    ).toBe(`${appRoutes.tripOverview(tripId)}?foo=1`);
    expect(
      resolveJoinPostAuthReturnTo(
        appRoutes.tripMembers(anotherTripId),
        tripId,
      ),
    ).toBeNull();
    expect(resolveJoinPostAuthReturnTo("/settings", tripId)).toBe("/settings");
    expect(
      resolveJoinPostAuthReturnTo(
        appRoutes.tripItinerary(tripId),
        tripId,
      ),
    ).toBe(appRoutes.tripItinerary(tripId));
  });
});
