import { describe, expect, it, vi } from "vitest";
import { createTripApiClient, mapCockpitResponse, type TripCockpitResponse } from "./api-client";

const cockpitResponse: TripCockpitResponse = {
  trip: {
    id: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
    name: "Hong Kong + Shenzhen Trip",
    destinationLabel: "Hong Kong + Shenzhen",
    startDate: "2025-05-15",
    endDate: "2025-05-20",
    joinId: "HK-SZ-2025",
    activePlanVariantId: "018f4e82-3000-7c00-b111-000000000001",
    ownerMemberId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
    version: 1,
  },
  members: [
    {
      id: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
      tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
      displayName: "Aom",
      role: "owner",
      accessStatus: "active",
      presence: "online",
      color: "#0f766e",
      userId: null,
      claimedAt: null,
      lastSeenAt: null,
    },
  ],
  planVariants: [
    {
      id: "018f4e82-3000-7c00-b111-000000000001",
      tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
      name: "Main",
      kind: "main",
      description: "Primary plan",
      version: 1,
    },
  ],
  itineraryItems: [
    {
      id: "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f",
      tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
      planVariantId: "018f4e82-3000-7c00-b111-000000000001",
      day: "2025-05-16",
      sortOrder: 100,
      startTime: "08:30",
      activity: "Dim Dim Sum",
      activityType: "food",
      place: "The Elements",
      linkLabel: "แผนที่",
      mapLink: "https://maps.google.com",
      coordinates: null,
      address: null,
      durationMinutes: 60,
      transportation: "walk",
      advisories: [],
      note: "breakfast",
      createdBy: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
      updatedAt: "2026-05-29T00:00:00.000Z",
      version: 4,
    },
  ],
  suggestions: [],
  stopNotes: [
    {
      id: "018f4e83-5410-7d8b-8f25-fd52c5e7bd30",
      tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
      itemId: "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f",
      authorId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
      body: "Bring voucher",
      createdAt: "2026-05-29T00:00:00.000Z",
      updatedAt: "2026-05-29T00:00:00.000Z",
      version: 1,
    },
  ],
  tasks: [
    {
      id: "018f4e84-1111-7000-8000-000000000001",
      tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
      title: "Buy eSIM",
      status: "open",
      visibility: "private",
      kind: "prep",
      createdBy: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
      assigneeId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
      relatedItemId: null,
      version: 1,
    },
  ],
  expenseSummary: {
    groupSpend: 0,
    netByMember: {},
    currentUserNetLabel: "settled",
    settlementSuggestions: [],
  },
};

describe("Trip API client", () => {
  it("joins, claims, and loads the backend cockpit through stable v1 routes", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({
        trip: cockpitResponse.trip,
        claimableMembers: cockpitResponse.members,
        joinSessionToken: "join-session-token",
        expiresAt: "2026-05-29T00:20:00.000Z",
      }))
      .mockResolvedValueOnce(jsonResponse({
        tripId: cockpitResponse.trip.id,
        memberId: cockpitResponse.members[0].id,
        sessionToken: "session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }))
      .mockResolvedValueOnce(jsonResponse(cockpitResponse));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    const join = await client.joinTrip({ joinId: "HK-SZ-2025", password: "dim-sum-run" });
    const session = await client.claimMember(join.trip.id, join.claimableMembers[0].id, "owner-pin", join.joinSessionToken);
    const cockpit = await client.loadTrip(join.trip.id, session.sessionToken);

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v1/trip-join-sessions",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ joinCode: "HK-SZ-2025", tripPassword: "dim-sum-run" }) }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/members/${cockpitResponse.members[0].id}/claims`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ participantPassword: "owner-pin", joinSessionToken: "join-session-token" }) }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}`,
      expect.objectContaining({ method: "GET", headers: expect.objectContaining({ Authorization: "Bearer session-token" }) }),
    );
    expect(cockpit.trip).toMatchObject({
      id: cockpitResponse.trip.id,
      joinPasswordHash: "",
      activePlanVariantId: cockpitResponse.trip.activePlanVariantId,
    });
    expect(cockpit.tasks).toEqual([
      {
        id: cockpitResponse.tasks[0].id,
        title: "Buy eSIM",
        status: "open",
        visibility: "private",
        kind: "prep",
        createdBy: cockpitResponse.members[0].id,
        assigneeId: cockpitResponse.members[0].id,
        relatedItemId: null,
        version: 1,
      },
    ]);
    expect(cockpit.stopNotes).toEqual(cockpitResponse.stopNotes);
    expect(cockpit.expenseSummary).toEqual(cockpitResponse.expenseSummary);
  });

  it("surfaces backend errors without leaking transport details into UI code", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ code: "invalid_credentials", message: "invalid credentials" }, 401));
    const client = createTripApiClient({ baseUrl: "", fetchImpl });

    await expect(client.joinTrip({ joinId: "bad", password: "wrong" })).rejects.toMatchObject({
      code: "invalid_credentials",
      message: "invalid credentials",
      status: 401,
    });
  });

  it("uses fallback error details when the backend returns a malformed error body", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response("not-json", { status: 502 }));
    const client = createTripApiClient({ fetchImpl });

    await expect(client.joinTrip({ joinId: "HK-SZ-2025", password: "dim-sum-run" })).rejects.toMatchObject({
      code: "request_failed",
      message: "request failed with 502",
      status: 502,
    });
  });

  it("uses default fetch and fills partial backend error bodies", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ code: "forbidden" }, 403));
    vi.stubGlobal("fetch", fetchImpl);
    const client = createTripApiClient();

    await expect(client.joinTrip({ joinId: "HK-SZ-2025", password: "dim-sum-run" })).rejects.toMatchObject({
      code: "forbidden",
      message: "request failed with 403",
      status: 403,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/v1/trip-join-sessions",
      expect.objectContaining({ method: "POST" }),
    );
    vi.unstubAllGlobals();
  });

  it("fills missing backend error codes while preserving messages", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ message: "not allowed" }, 403));
    const client = createTripApiClient({ fetchImpl });

    await expect(client.joinTrip({ joinId: "HK-SZ-2025", password: "dim-sum-run" })).rejects.toMatchObject({
      code: "request_failed",
      message: "not allowed",
      status: 403,
    });
  });

  it("logs out through an encoded trip session route and accepts 204 responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createTripApiClient({ baseUrl: "https://api.example.test/", fetchImpl });

    await expect(client.logout("trip/with space", "session-token")).resolves.toBeUndefined();

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/trips/trip%2Fwith%20space/member-sessions/current",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
  });

  it("logs into an existing participant through the encoded member route", async () => {
    const session = {
      tripId: "trip/with space",
      memberId: "member/beam",
      sessionToken: "session-token",
      createdAt: "2026-05-29T00:00:00.000Z",
      expiresAt: "2026-06-28T00:00:00.000Z",
    };
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(session));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.loginMember("trip/with space", "member/beam", "old-pin", "join-session-token")).resolves.toEqual(session);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/trips/trip%2Fwith%20space/member-sessions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ memberId: "member/beam", participantPassword: "old-pin", joinSessionToken: "join-session-token" }),
      }),
    );
  });

  it("falls back to an empty active plan id when the backend has no active or listed variant", () => {
    const cockpit = mapCockpitResponse({
      ...cockpitResponse,
      trip: { ...cockpitResponse.trip, activePlanVariantId: null },
      planVariants: [],
    });

    expect(cockpit.trip.activePlanVariantId).toBe("");
  });

  it("creates and patches tasks through authenticated backend routes", async () => {
    const createdTask = {
      ...cockpitResponse.tasks[0],
      id: "018f4e84-1111-7000-8000-000000000002",
      title: "Exchange HKD",
      status: "open",
      version: 1,
    };
    const patchedTask = { ...createdTask, status: "done", version: 2 };
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(createdTask, 201)).mockResolvedValueOnce(jsonResponse(patchedTask));
    const client = createTripApiClient({ baseUrl: "https://api.example.test/", fetchImpl });

    const task = await client.createTask(cockpitResponse.trip.id, "session-token", {
      clientMutationId: "web-task-1",
      title: "Exchange HKD",
      visibility: "shared",
      kind: "prep",
      assigneeId: cockpitResponse.members[0].id,
      relatedItemId: null,
    });
    const doneTask = await client.patchTask(cockpitResponse.trip.id, task.id, "session-token", {
      clientMutationId: "web-task-2",
      expectedVersion: 1,
      patch: { status: "done" },
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/tasks`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/tasks/${createdTask.id}`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ clientMutationId: "web-task-2", expectedVersion: 1, patch: { status: "done" } }),
      }),
    );
    expect(task).toMatchObject({ id: createdTask.id, title: "Exchange HKD", version: 1 });
    expect(doneTask).toMatchObject({ id: createdTask.id, status: "done", version: 2 });
  });

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
      planVariantId: cockpitResponse.trip.activePlanVariantId ?? cockpitResponse.planVariants[0].id,
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
      planVariantId: cockpitResponse.trip.activePlanVariantId ?? cockpitResponse.planVariants[0].id,
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
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
