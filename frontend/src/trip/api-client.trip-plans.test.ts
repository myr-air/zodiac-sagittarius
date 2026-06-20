import { describe, expect, it, vi } from "vitest";
import { createTripApiClient, mapCockpitResponse, TripApiError, type TripCockpitResponse } from "./api-client";
import { cockpitResponse, jsonResponse } from "./api-client.test-support";

describe("Trip API client Trip Plans", () => {
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

  it("creates patches and sets main trip plans through canonical methods and backend routes", async () => {
    const createdVariant = {
      id: "018f4e82-3000-7c00-b111-000000000099",
      tripId: cockpitResponse.trip.id,
      name: "Rain backup",
      kind: "backup" as const,
      status: "backup" as const,
      description: "Indoor route",
      version: 1,
    };
    const patchedVariant = {
      ...createdVariant,
      name: "Rain day backup",
      version: 2,
    };
    const publishedTrip = {
      ...cockpitResponse.trip,
      activePlanVariantId: createdVariant.id,
      mainTripPlanId: createdVariant.id,
      version: 2,
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(createdVariant, 201))
      .mockResolvedValueOnce(jsonResponse(patchedVariant))
      .mockResolvedValueOnce(jsonResponse(publishedTrip));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    const created = await client.createTripPlan!(cockpitResponse.trip.id, "session-token", {
      clientMutationId: "web-plan-create-1",
      name: "Rain backup",
      status: "backup",
      description: "Indoor route",
    });
    const patched = await client.patchTripPlan!(cockpitResponse.trip.id, created.id, "session-token", {
      clientMutationId: "web-plan-patch-1",
      expectedVersion: 1,
      patch: { name: "Rain day backup" },
    });
    const trip = await client.setMainTripPlan!(cockpitResponse.trip.id, created.id, "session-token", {
      clientMutationId: "web-plan-publish-1",
      previousMainNextStatus: "backup",
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/trip-plans`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/trip-plans/${createdVariant.id}`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ clientMutationId: "web-plan-patch-1", expectedVersion: 1, patch: { name: "Rain day backup" } }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/trip-plans/${createdVariant.id}/set-main`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ clientMutationId: "web-plan-publish-1", previousMainNextStatus: "backup" }),
      }),
    );
    expect(created).toMatchObject({ id: createdVariant.id, kind: "backup", status: "backup", version: 1 });
    expect(patched).toMatchObject({ name: "Rain day backup", version: 2 });
    expect(trip.activePlanVariantId).toBe(createdVariant.id);
    expect(trip.mainTripPlanId).toBe(createdVariant.id);
    expect(trip.version).toBe(2);
  });

  it("rejects canonical trip plan route responses that omit status", async () => {
    const legacyShapedVariant = {
      id: "018f4e82-3000-7c00-b111-000000000098",
      tripId: cockpitResponse.trip.id,
      name: "Legacy-shaped proposal",
      kind: "split" as const,
      description: "Compatibility response",
      version: 1,
    };
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(legacyShapedVariant, 201));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(
      client.createTripPlan!(cockpitResponse.trip.id, "session-token", {
        clientMutationId: "web-plan-create-legacy-shaped",
        name: "Legacy-shaped proposal",
        kind: "split",
      }),
    ).rejects.toMatchObject({
      code: "invalid_response",
      status: 0,
    });
  });
});
