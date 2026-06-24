import { describe, expect, it } from "vitest";
import { mapCockpitResponse, type TripCockpitResponse } from "../../api-client";
import { cockpitResponse } from "../../testing/support/api-client-test-utils";

describe("Trip API cockpit response mapping", () => {
  it("maps V1 trip, item, and latest plan check fields from cockpit response", () => {
    const response: TripCockpitResponse = {
      ...cockpitResponse,
      trip: {
        ...cockpitResponse.trip,
        partySize: 4,
        defaultTimezone: "Asia/Hong_Kong",
      },
      itineraryItems: cockpitResponse.itineraryItems.map((item) => ({
        ...item,
        parentItemId: null,
        itemKind: "meal",
        timeMode: "flexible",
        isPlanBlock: false,
        status: "planned",
        priority: "must",
      })),
      latestPlanCheck: {
        id: "plan-check-1",
        tripId: cockpitResponse.trip.id,
        createdBy: cockpitResponse.members[0].id,
        itineraryFingerprint: "abc",
        stale: false,
        status: "complete",
        languageMetadata: { provider: "rules" },
        createdAt: "2026-06-10T00:00:00.000Z",
        completedAt: "2026-06-10T00:00:01.000Z",
        version: 1,
        suggestions: [],
      },
    };

    const cockpit = mapCockpitResponse(response);

    expect(cockpit.trip.partySize).toBe(4);
    expect(cockpit.trip.defaultTimezone).toBe("Asia/Hong_Kong");
    expect(cockpit.trip.itineraryItems[0]).toMatchObject({
      itemKind: "meal",
      timeMode: "flexible",
      status: "planned",
      priority: "must",
    });
    expect(cockpit.latestPlanCheck?.id).toBe("plan-check-1");
  });
});
