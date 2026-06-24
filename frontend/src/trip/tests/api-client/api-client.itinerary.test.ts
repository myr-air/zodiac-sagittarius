import { describe, expect, it, vi } from "vitest";
import { createTripApiClient } from "../../api-client";
import { cockpitResponse, jsonResponse } from "../../testing/support/api-client-test-utils";

describe("Trip API client itinerary routes", () => {
  it("patches itinerary items and creates or resolves suggestions through authenticated backend routes", async () => {
    const patchedItem = {
      ...cockpitResponse.itineraryItems[0],
      startTime: "09:00",
      durationMinutes: 75,
      version: 5,
    };
    const createdSuggestion = {
      id: "018f4e85-1111-7000-8000-000000000001",
      tripId: cockpitResponse.trip.id,
      planVariantId: cockpitResponse.trip.activePlanVariantId ?? cockpitResponse.planVariants![0].id,
      proposerId: cockpitResponse.members[0].id,
      type: "edit",
      targetItemId: patchedItem.id,
      proposedPatch: { note: "Book ahead" },
      sourceVersion: 5,
      status: "pending",
      createdAt: "2026-05-29T00:00:00.000Z",
    };
    const approvedSuggestion = { ...createdSuggestion, status: "approved" };
    const rejectedSuggestion = { ...createdSuggestion, id: "018f4e85-1111-7000-8000-000000000002", status: "rejected" };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(patchedItem))
      .mockResolvedValueOnce(jsonResponse(createdSuggestion, 201))
      .mockResolvedValueOnce(jsonResponse(approvedSuggestion))
      .mockResolvedValueOnce(jsonResponse(rejectedSuggestion));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    const item = await client.patchItineraryItem(cockpitResponse.trip.id, patchedItem.id, "session-token", {
      clientMutationId: "web-item-1",
      expectedVersion: 4,
      patch: { startTime: "09:00", durationMinutes: 75 },
    });
    const suggestion = await client.createSuggestion(cockpitResponse.trip.id, "session-token", {
      clientMutationId: "web-suggestion-1",
      type: "edit",
      targetItemId: patchedItem.id,
      planVariantId: cockpitResponse.trip.activePlanVariantId ?? cockpitResponse.planVariants![0].id,
      sourceVersion: 5,
      proposedPatch: { note: "Book ahead" },
    });
    const approved = await client.approveSuggestion(cockpitResponse.trip.id, suggestion.id, "session-token");
    const rejected = await client.rejectSuggestion(cockpitResponse.trip.id, rejectedSuggestion.id, "session-token");

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/itinerary-items/${patchedItem.id}`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify({ clientMutationId: "web-item-1", expectedVersion: 4, patch: { startTime: "09:00", durationMinutes: 75 } }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/suggestions`,
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer session-token" }) }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/suggestions/${createdSuggestion.id}`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify({ status: "approved" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      4,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/suggestions/${rejectedSuggestion.id}`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify({ status: "rejected" }),
      }),
    );
    expect(item).toMatchObject({ id: patchedItem.id, startTime: "09:00", durationMinutes: 75, version: 5 });
    expect(suggestion).toMatchObject({ id: createdSuggestion.id, status: "pending" });
    expect(approved).toMatchObject({ id: createdSuggestion.id, status: "approved" });
    expect(rejected).toMatchObject({ id: rejectedSuggestion.id, status: "rejected" });
  });

  it("calls plan check and plan suggestion routes", async () => {
    const planCheck = {
      id: "plan-check-1",
      tripId: cockpitResponse.trip.id,
      tripPlanId: cockpitResponse.trip.activePlanVariantId,
      createdBy: cockpitResponse.members[0].id,
      itineraryFingerprint: "abc",
      stale: false,
      status: "complete",
      languageMetadata: { provider: "rules" },
      createdAt: "2026-06-10T00:00:00.000Z",
      completedAt: "2026-06-10T00:00:01.000Z",
      version: 1,
      suggestions: [{
        id: "suggestion-1",
        tripId: cockpitResponse.trip.id,
        planCheckId: "plan-check-1",
        severity: "warning",
        scope: "item",
        targetItemIds: [cockpitResponse.itineraryItems[0].id],
        explanation: { en: "Missing detail", th: "ยังขาดรายละเอียด" },
        recommendedAction: { en: "Add detail", th: "เพิ่มรายละเอียด" },
        actionKind: "editItem",
        actionPayload: { itemId: cockpitResponse.itineraryItems[0].id },
        status: "pending",
        snoozedUntil: null,
        createdAt: "2026-06-10T00:00:00.000Z",
        updatedAt: "2026-06-10T00:00:00.000Z",
        version: 1,
      }],
    };
    const patchedSuggestion = { ...planCheck.suggestions[0], status: "dismissed", version: 2 };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(planCheck))
      .mockResolvedValueOnce(jsonResponse(planCheck))
      .mockResolvedValueOnce(jsonResponse(patchedSuggestion));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.runPlanCheck?.(cockpitResponse.trip.id, "session-token", cockpitResponse.trip.activePlanVariantId)).resolves.toEqual(planCheck);
    await expect(client.latestPlanCheck?.(cockpitResponse.trip.id, "session-token", cockpitResponse.trip.activePlanVariantId)).resolves.toEqual(planCheck);
    await expect(client.patchPlanSuggestion?.(cockpitResponse.trip.id, "suggestion-1", "session-token", {
      expectedVersion: 1,
      status: "dismissed",
    })).resolves.toMatchObject({ status: "dismissed", version: 2 });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/plan-checks?tripPlanId=${cockpitResponse.trip.activePlanVariantId}`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/plan-checks/latest?tripPlanId=${cockpitResponse.trip.activePlanVariantId}`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/plan-suggestions/suggestion-1`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ expectedVersion: 1, status: "dismissed" }),
      }),
    );
  });
});
