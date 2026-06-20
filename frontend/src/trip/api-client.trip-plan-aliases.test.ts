import { describe, expect, it, vi } from "vitest";
import { createTripApiClient, mapCockpitResponse, TripApiError, type TripCockpitResponse } from "./api-client";
import { cockpitResponse, jsonResponse } from "./api-client.test-support";

describe("Trip API client Trip Plan aliases", () => {
  it("rejects join and invite Main Plan pointer alias drift", async () => {
    const driftedJoinResponse = {
      trip: {
        ...cockpitResponse.trip,
        activePlanVariantId: "legacy-main-plan",
        mainTripPlanId: "canonical-main-plan",
      },
      claimableMembers: cockpitResponse.members,
      joinSessionToken: "join-session-token",
      expiresAt: "2026-06-11T12:00:00.000Z",
    };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(driftedJoinResponse))
      .mockResolvedValueOnce(jsonResponse(driftedJoinResponse));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.joinTrip({ joinId: "HK-SZ-2025", password: "seed-trip-pass" })).rejects.toMatchObject({
      code: "invalid_response",
    });
    await expect(client.resolveJoinInviteToken?.("invite-token")).rejects.toMatchObject({
      code: "invalid_response",
    });
  });

  it("rejects canonical cockpit tripPlans that omit status", () => {
    const canonicalPlanWithoutStatus = { ...cockpitResponse.tripPlans![0] };
    delete (canonicalPlanWithoutStatus as Partial<typeof canonicalPlanWithoutStatus>).status;

    expect(() =>
      mapCockpitResponse({
        ...cockpitResponse,
        planVariants: [],
        tripPlans: [canonicalPlanWithoutStatus as unknown as NonNullable<TripCockpitResponse["tripPlans"]>[number]],
      }),
    ).toThrow(TripApiError);
  });

  it("rejects mixed cockpit Trip Plan aliases when identities or versions drift", () => {
    const canonicalPlan = {
      ...cockpitResponse.tripPlans![0],
      id: "018f4e82-3000-7c00-b111-0000000000c4",
      kind: "draft" as const,
      status: "draft" as const,
      name: "Canonical draft",
      version: 3,
    };
    const staleLegacyPlan = {
      ...cockpitResponse.planVariants![0],
      id: "018f4e82-3000-7c00-b111-0000000000c5",
      kind: "backup" as const,
      status: "backup" as const,
      name: "Stale legacy backup",
      version: 1,
    };

    expect(() =>
      mapCockpitResponse({
        ...cockpitResponse,
        trip: {
          ...cockpitResponse.trip,
          activePlanVariantId: canonicalPlan.id,
          mainTripPlanId: canonicalPlan.id,
        },
        planVariants: [staleLegacyPlan],
        tripPlans: [canonicalPlan],
      }),
    ).toThrow(TripApiError);

    expect(() =>
      mapCockpitResponse({
        ...cockpitResponse,
        trip: {
          ...cockpitResponse.trip,
          activePlanVariantId: canonicalPlan.id,
          mainTripPlanId: canonicalPlan.id,
        },
        planVariants: [{ ...canonicalPlan, version: canonicalPlan.version - 1 }],
        tripPlans: [canonicalPlan],
      }),
    ).toThrow(TripApiError);
  });

  it("rejects mixed cockpit Trip Plan aliases when mapped kind and status drift", () => {
    const canonicalPlan = {
      ...cockpitResponse.tripPlans![0],
      id: "018f4e82-3000-7c00-b111-0000000000c6",
      kind: "draft" as const,
      status: "draft" as const,
      name: "Draft route",
      version: 3,
    };
    const legacyPlan = {
      ...canonicalPlan,
      kind: "backup" as const,
      status: "backup" as const,
    };

    expect(() =>
      mapCockpitResponse({
        ...cockpitResponse,
        trip: {
          ...cockpitResponse.trip,
          activePlanVariantId: cockpitResponse.trip.activePlanVariantId,
          mainTripPlanId: cockpitResponse.trip.activePlanVariantId ?? undefined,
        },
        planVariants: [legacyPlan],
        tripPlans: [canonicalPlan],
      }),
    ).toThrow(TripApiError);
  });

  it("rejects mixed cockpit Main Plan pointer aliases when they drift", () => {
    const plan = cockpitResponse.tripPlans![0];

    expect(() =>
      mapCockpitResponse({
        ...cockpitResponse,
        trip: {
          ...cockpitResponse.trip,
          activePlanVariantId: "018f4e82-3000-7c00-b111-0000000000d1",
          mainTripPlanId: plan.id,
        },
        planVariants: [plan],
        tripPlans: [plan],
      }),
    ).toThrow(TripApiError);
  });

  it("keeps the Main Plan pointer authoritative when plan status disagrees", () => {
    const pointerPlan = {
      ...cockpitResponse.tripPlans![0],
      id: "018f4e82-3000-7c00-b111-0000000000c2",
      kind: "draft" as const,
      status: "draft" as const,
      name: "Pointer draft",
    };
    const staleStatusPlan = {
      ...cockpitResponse.tripPlans![0],
      id: "018f4e82-3000-7c00-b111-0000000000c3",
      kind: "main" as const,
      status: "main" as const,
      name: "Stale status main",
    };

    const cockpit = mapCockpitResponse({
      ...cockpitResponse,
      trip: {
        ...cockpitResponse.trip,
        activePlanVariantId: pointerPlan.id,
        mainTripPlanId: pointerPlan.id,
      },
      planVariants: [pointerPlan, staleStatusPlan],
      tripPlans: [pointerPlan, staleStatusPlan],
    });

    expect(cockpit.trip.activePlanVariantId).toBe(pointerPlan.id);
    expect(cockpit.trip.mainTripPlanId).toBe(pointerPlan.id);
    expect(cockpit.trip.tripPlans?.find((plan) => plan.id === pointerPlan.id)).toMatchObject({
      kind: "main",
      status: "main",
    });
    expect(cockpit.trip.tripPlans?.find((plan) => plan.id === staleStatusPlan.id)).toMatchObject({
      kind: "backup",
      status: "backup",
    });
  });
});
