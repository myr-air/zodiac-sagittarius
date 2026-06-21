import { describe, expect, it } from "vitest";
import { mapCockpitResponse } from "../../api-client";
import { cockpitResponse } from "../api-client/api-client.test-support";

describe("Trip API client Trip Plans", () => {
  it("falls back to an empty active plan id when the backend has no active or listed variant", () => {
    const cockpit = mapCockpitResponse({
      ...cockpitResponse,
      trip: { ...cockpitResponse.trip, activePlanVariantId: null },
      planVariants: [],
      tripPlans: [],
    });

    expect(cockpit.trip.activePlanVariantId).toBe("");
  });

  it("maps canonical trip plan fields while preserving legacy plan variant fields", () => {
    const canonicalPlan = {
      ...cockpitResponse.planVariants![0],
      status: "proposal" as const,
      kind: "split" as const,
      name: "Client proposal",
    };
    const cockpit = mapCockpitResponse({
      ...cockpitResponse,
      trip: {
        ...cockpitResponse.trip,
        activePlanVariantId: null,
        mainTripPlanId: canonicalPlan.id,
      },
      planVariants: [],
      tripPlans: [canonicalPlan],
    });

    expect(cockpit.trip.activePlanVariantId).toBe(canonicalPlan.id);
    expect(cockpit.trip.mainTripPlanId).toBe(canonicalPlan.id);
    expect(cockpit.trip.planVariants[0]).toMatchObject({
      id: canonicalPlan.id,
      kind: "main",
      status: "main",
    });
    expect(cockpit.trip.tripPlans?.[0]).toMatchObject({
      id: canonicalPlan.id,
      status: "main",
    });
  });

  it("maps legacy-only plan variants to canonical Trip Plan state", () => {
    const legacyPlan = {
      ...cockpitResponse.planVariants![0],
      kind: "split" as const,
      status: undefined,
      name: "Legacy client proposal",
    };
    const legacyOnlyResponse = {
      ...cockpitResponse,
      trip: {
        ...cockpitResponse.trip,
        activePlanVariantId: legacyPlan.id,
        mainTripPlanId: undefined,
      },
      planVariants: [legacyPlan],
    };
    delete legacyOnlyResponse.tripPlans;

    const cockpit = mapCockpitResponse(legacyOnlyResponse);

    expect(cockpit.trip.activePlanVariantId).toBe(legacyPlan.id);
    expect(cockpit.trip.mainTripPlanId).toBe(legacyPlan.id);
    expect(cockpit.trip.planVariants[0]).toMatchObject({
      id: legacyPlan.id,
      kind: "main",
      status: "main",
    });
    expect(cockpit.trip.tripPlans?.[0]).toMatchObject({
      id: legacyPlan.id,
      status: "main",
    });
  });

  it("maps a canonical-only cockpit payload without legacy planVariants", () => {
    const canonicalPlan = {
      ...cockpitResponse.tripPlans![0],
      id: "018f4e82-3000-7c00-b111-0000000000c1",
      status: "draft" as const,
      kind: "draft" as const,
      name: "Draft route",
    };
    const canonicalOnlyResponse = {
      ...cockpitResponse,
      trip: {
        ...cockpitResponse.trip,
        activePlanVariantId: null,
        mainTripPlanId: canonicalPlan.id,
      },
      tripPlans: [canonicalPlan],
    };
    delete canonicalOnlyResponse.planVariants;

    const cockpit = mapCockpitResponse(canonicalOnlyResponse);

    expect(cockpit.trip.activePlanVariantId).toBe(canonicalPlan.id);
    expect(cockpit.trip.mainTripPlanId).toBe(canonicalPlan.id);
    expect(cockpit.trip.planVariants).toHaveLength(1);
    expect(cockpit.trip.planVariants[0]).toMatchObject({
      id: canonicalPlan.id,
      kind: "main",
      status: "main",
    });
    expect(cockpit.trip.tripPlans?.[0]).toMatchObject({
      id: canonicalPlan.id,
      status: "main",
    });
  });
});
