import { describe, expect, it } from "vitest";
import { TripApiError } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import { errorMessage, tripFromJoinResponse } from "./trip-join-gate.support";

describe("trip join gate support", () => {
  it("keeps canonical Main Plan aliases from API join summaries", () => {
    const joinedTrip = tripFromJoinResponse({
      trip: {
        id: seedTrip.id,
        name: seedTrip.name,
        destinationLabel: seedTrip.destinationLabel,
        startDate: seedTrip.startDate,
        endDate: seedTrip.endDate,
        joinId: seedTrip.joinId,
        activePlanVariantId: "canonical-main-plan",
        mainTripPlanId: "canonical-main-plan",
        ownerMemberId: seedTrip.members[0].id,
        version: 1,
      },
      claimableMembers: [],
      joinSessionToken: "join-session-token",
      expiresAt: "2026-05-29T00:20:00.000Z",
    });

    expect(joinedTrip.activePlanVariantId).toBe("canonical-main-plan");
    expect(joinedTrip.mainTripPlanId).toBe("canonical-main-plan");

    const legacyOnlyTrip = tripFromJoinResponse({
      trip: {
        id: seedTrip.id,
        name: seedTrip.name,
        destinationLabel: seedTrip.destinationLabel,
        startDate: seedTrip.startDate,
        endDate: seedTrip.endDate,
        joinId: seedTrip.joinId,
        activePlanVariantId: "legacy-main-plan",
        ownerMemberId: seedTrip.members[0].id,
        version: 1,
      },
      claimableMembers: [],
      joinSessionToken: "join-session-token",
      expiresAt: "2026-05-29T00:20:00.000Z",
    });

    expect(legacyOnlyTrip.mainTripPlanId).toBe("legacy-main-plan");
  });

  it("rejects API join summaries with Main Plan pointer alias drift", () => {
    expect(() =>
      tripFromJoinResponse({
        trip: {
          id: seedTrip.id,
          name: seedTrip.name,
          destinationLabel: seedTrip.destinationLabel,
          startDate: seedTrip.startDate,
          endDate: seedTrip.endDate,
          joinId: seedTrip.joinId,
          activePlanVariantId: "legacy-main-plan",
          mainTripPlanId: "canonical-main-plan",
          ownerMemberId: seedTrip.members[0].id,
          version: 1,
        },
        claimableMembers: [],
        joinSessionToken: "join-session-token",
        expiresAt: "2026-05-29T00:20:00.000Z",
      }),
    ).toThrow(/Trip Plan compatibility aliases/i);
  });

  it("keeps user-safe fallback copy for expected API errors", () => {
    expect(errorMessage(new TripApiError({ code: "not_found", message: "No trip", status: 404 }), "Try again")).toBe("Try again");
    expect(errorMessage(new TripApiError({ code: "custom_join_error", message: "Custom", status: 409 }), "Try again")).toBe("custom_join_error");
  });
});
