import { describe, expect, it } from "vitest";
import { encodeReturnTo } from "@/src/routes/app-routes";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  resolveJoinPostAuthReturnTo,
  resolveParticipantPostAuthHref,
} from "./participant-post-auth-navigation";

describe("resolveParticipantPostAuthHref", () => {
  it("returns a safe same-trip return path after participant authentication", () => {
    expect(
      resolveParticipantPostAuthHref({
        encodedReturnTo: encodeReturnTo(appRoutes.tripItinerary("trip-1")),
        tripId: "trip-1",
      }),
    ).toBe(appRoutes.tripItinerary("trip-1"));
  });

  it("falls back to trip overview when no routed trip owns the current page", () => {
    expect(
      resolveParticipantPostAuthHref({
        encodedReturnTo: null,
        tripId: "trip-1",
      }),
    ).toBe(appRoutes.tripOverview("trip-1"));
  });

  it("keeps routed trip pages in place when there is no safe return target", () => {
    expect(
      resolveParticipantPostAuthHref({
        encodedReturnTo: null,
        routeTripId: "trip-1",
        tripId: "trip-1",
      }),
    ).toBeNull();
  });

  it("rejects return targets for a different trip", () => {
    expect(
      resolveParticipantPostAuthHref({
        encodedReturnTo: encodeReturnTo(appRoutes.tripItinerary("other-trip")),
        tripId: "trip-1",
      }),
    ).toBe(appRoutes.tripOverview("trip-1"));
  });
});

describe("resolveJoinPostAuthReturnTo", () => {
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
  });
});
