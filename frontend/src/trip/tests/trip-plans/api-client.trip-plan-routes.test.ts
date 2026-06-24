import { describe, expect, it, vi } from "vitest";
import { createTripApiClient } from "../../api-client";
import { cockpitResponse, jsonResponse } from "../../testing/support/api-client-test-utils";

describe("Trip API client Trip Plan routes", () => {
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
