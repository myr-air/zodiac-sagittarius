import { describe, expect, it, vi } from "vitest";
import { createTripApiClient, mapCockpitResponse, type TripCockpitResponse } from "./api-client";
import { cockpitResponse, jsonResponse } from "./api-client.test-support";
import { pathIdRain } from "./testing/itinerary-path-fixtures";

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

    const join = await client.joinTrip({ joinId: "HK-SZ-2025", password: "seed-trip-pass" });
    const session = await client.claimMember(join.trip.id, join.claimableMembers[0].id, "owner-pin", join.joinSessionToken);
    const cockpit = await client.loadTrip(join.trip.id, session.sessionToken);

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v1/trip-join-sessions",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ joinCode: "HK-SZ-2025", tripPassword: "seed-trip-pass" }) }),
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
        tripPlanId: cockpitResponse.planVariants![0].id,
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
    expect(cockpit.trip.expenses[0]).toMatchObject({
      id: cockpitResponse.expenses[0].id,
      tripPlanId: cockpitResponse.planVariants![0].id,
      amount: 240,
      splits: { "018f4e81-77a4-7b8f-b3bd-0d0f493ac561": 240 },
    });
    expect(cockpit.trip.itineraryItems[0]).toMatchObject({
      pathGroupId: "group-breakfast",
      pathId: pathIdRain,
      pathName: "Rain plan",
      pathRole: "alternative",
      endTime: "09:30",
      endOffsetDays: 0,
    });
    expect(cockpit.trip.bookingDocs?.[0]).toMatchObject({
      id: "booking-api-flight",
      tripPlanId: cockpitResponse.planVariants![0].id,
      externalLinks: [{ id: "booking-api-flight-link", label: "Drive", url: "https://drive.google.com/api-flight", provider: "Google Drive" }],
    });
    expect(cockpit.trip.photoAlbumLinks?.[0]).toMatchObject({
      id: "018f4e89-1111-7000-8000-000000000001",
      title: "API group album",
      provider: "google_photos",
    });
    expect(cockpit.expenseSummary).toEqual(cockpitResponse.expenseSummary);
  });

  it("rejects cockpit payloads that omit the bookingDocs source of truth", () => {
    const responseWithoutBookingDocs = { ...cockpitResponse };
    delete (responseWithoutBookingDocs as Partial<TripCockpitResponse>).bookingDocs;

    expect(() => mapCockpitResponse(responseWithoutBookingDocs as unknown as TripCockpitResponse)).toThrow("bookingDocs");
  });

  it("rejects cockpit payloads that omit the photoAlbumLinks source of truth", () => {
    const responseWithoutPhotoAlbums = { ...cockpitResponse };
    delete (responseWithoutPhotoAlbums as Partial<TripCockpitResponse>).photoAlbumLinks;

    expect(() => mapCockpitResponse(responseWithoutPhotoAlbums as unknown as TripCockpitResponse)).toThrow("photoAlbumLinks");
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

    await expect(client.joinTrip({ joinId: "HK-SZ-2025", password: "seed-trip-pass" })).rejects.toMatchObject({
      code: "request_failed",
      message: "request failed with 502",
      status: 502,
    });
  });

  it("uses default fetch and fills partial backend error bodies", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ code: "forbidden" }, 403));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchImpl as unknown as typeof fetch;
    try {
      const client = createTripApiClient();

      await expect(client.joinTrip({ joinId: "HK-SZ-2025", password: "seed-trip-pass" })).rejects.toMatchObject({
        code: "forbidden",
        message: "request failed with 403",
        status: 403,
      });

      expect(fetchImpl).toHaveBeenCalledWith(
        "/api/v1/trip-join-sessions",
        expect.objectContaining({ method: "POST" }),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("fills missing backend error codes while preserving messages", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ message: "not allowed" }, 403));
    const client = createTripApiClient({ fetchImpl });

    await expect(client.joinTrip({ joinId: "HK-SZ-2025", password: "seed-trip-pass" })).rejects.toMatchObject({
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

  it("resolves and rotates tokenized join invite links through encoded routes", async () => {
    const inviteResponse = {
      trip: {
        ...cockpitResponse.trip,
        mainTripPlanId: cockpitResponse.trip.activePlanVariantId,
      },
      claimableMembers: cockpitResponse.members,
      joinSessionToken: "fresh-join-session-token",
      expiresAt: "2026-06-11T12:00:00.000Z",
    };
    const rotateResponse = {
      token: "fresh-invite-token",
      expiresAt: "2026-06-11T12:00:00.000Z",
    };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(inviteResponse))
      .mockResolvedValueOnce(jsonResponse(rotateResponse));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.resolveJoinInviteToken?.("invite/token value")).resolves.toEqual(inviteResponse);
    await expect(client.rotateJoinInviteToken?.("trip/with space", "member-session-token")).resolves.toEqual(rotateResponse);

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v1/trip-join-invite-tokens/current?token=invite%2Ftoken+value",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/v1/trips/trip%2Fwith%20space/join-invite-tokens",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer member-session-token" }),
      }),
    );
  });

  it("patches trip metadata through the authenticated trip route", async () => {
    const patchedTrip = {
      ...cockpitResponse.trip,
      name: "Hong Kong revised",
      destinationLabel: "Hong Kong",
      countries: ["Hong Kong"],
      version: 2,
    };
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(patchedTrip));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });
    const request = {
      clientMutationId: "trip-patch-1",
      expectedVersion: 1,
      name: "Hong Kong revised",
      destinationLabel: "Hong Kong",
      countries: ["Hong Kong"],
    };

    await expect(client.patchTrip(cockpitResponse.trip.id, "session-token", request)).resolves.toMatchObject({
      id: patchedTrip.id,
      name: "Hong Kong revised",
      destinationLabel: "Hong Kong",
      version: 2,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify(request),
      }),
    );
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

  it("lists members through the authenticated backend members route", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(cockpitResponse.members));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.listMembers(cockpitResponse.trip.id, "session-token")).resolves.toEqual(
      cockpitResponse.members.map((member) => expect.objectContaining({
        id: member.id,
        displayName: member.displayName,
        role: member.role,
        accessStatus: member.accessStatus,
      })),
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/members`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
  });

  it("updates presence through the authenticated backend presence route", async () => {
    const onlineMember = { ...cockpitResponse.members[0], presence: "online", lastSeenAt: "2026-06-03T12:00:00Z" };
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(onlineMember));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });
    const request = { clientMutationId: "presence-1", presence: "online" as const };

    await expect(client.updatePresence(cockpitResponse.trip.id, "session-token", request)).resolves.toMatchObject({
      id: onlineMember.id,
      presence: "online",
      lastSeenAt: "2026-06-03T12:00:00Z",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/presence`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify(request),
      }),
    );
  });

  it("lists and patches daily briefings through authenticated backend routes", async () => {
    const briefing = {
      tripId: cockpitResponse.trip.id,
      date: "2026-07-09",
      locationKey: "destination:hong-kong",
      locationLabel: "Hong Kong",
      coordinates: null,
      weather: null,
      holiday: null,
      festival: null,
      facts: null,
      outfitAdvice: null,
      manualOverrides: {},
      updatedAt: "2026-06-04T00:00:00Z",
      version: 1,
    };
    const patchedBriefing = {
      ...briefing,
      manualOverrides: { outfitAdvice: "Bring umbrella" },
      updatedAt: "2026-06-04T00:10:00Z",
      version: 2,
    };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse([briefing]))
      .mockResolvedValueOnce(jsonResponse(patchedBriefing));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.listDailyBriefings(cockpitResponse.trip.id, "session-token")).resolves.toEqual([briefing]);
    await expect(client.patchDailyBriefing(cockpitResponse.trip.id, "2026-07-09", "session-token", {
      clientMutationId: "briefing-1",
      expectedVersion: 1,
      dayTitle: "Dim sum day",
      outfitAdvice: "Bring umbrella",
    })).resolves.toMatchObject({ manualOverrides: { outfitAdvice: "Bring umbrella" }, version: 2 });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/daily-briefings`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/daily-briefings/2026-07-09`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify({
          clientMutationId: "briefing-1",
          expectedVersion: 1,
          dayTitle: "Dim sum day",
          outfitAdvice: "Bring umbrella",
        }),
      }),
    );
  });

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
