import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { tripFromJoinResponse } from "./trip-join-response-mapper";

describe("trip join response mapper", () => {
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
});
