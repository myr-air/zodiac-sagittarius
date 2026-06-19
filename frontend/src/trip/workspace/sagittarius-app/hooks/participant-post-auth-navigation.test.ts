import { describe, expect, it } from "vitest";
import { encodeReturnTo } from "@/src/routes/app-routes";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { resolveParticipantPostAuthHref } from "./participant-post-auth-navigation";

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
