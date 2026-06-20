import { describe, expect, it, vi } from "vitest";
import { createTripApiClient, mapCockpitResponse, TripApiError, type TripCockpitResponse } from "./api-client";
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

  it("posts itinerary import content to the backend normalizer route", async () => {
    const document = {
      schema: "joii.itinerary.export",
      version: 1,
      source: "ai",
      exportedAt: "2026-06-04T12:00:00.000Z",
      trip: {
        id: cockpitResponse.trip.id,
        name: cockpitResponse.trip.name,
        destinationLabel: cockpitResponse.trip.destinationLabel,
        startDate: cockpitResponse.trip.startDate,
        endDate: cockpitResponse.trip.endDate,
        activePlanVariantId: cockpitResponse.trip.activePlanVariantId,
      },
      items: [],
      records: {
        expenses: [
          {
            id: "import-expense",
            tripId: cockpitResponse.trip.id,
            tripPlanId: cockpitResponse.trip.activePlanVariantId,
            title: "Imported ticket receipt",
            amount: 120,
            paidBy: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
            splits: { "018f4e81-77a4-7b8f-b3bd-0d0f493ac561": 120 },
            category: "tickets",
            itineraryItemId: "import-flight-block",
          },
        ],
        bookingDocs: [],
        stopNotes: [],
        tasks: [],
      },
    };
    const normalizedDocument = {
      ...document,
      trip: {
        ...document.trip,
        mainTripPlanId: cockpitResponse.trip.activePlanVariantId,
        planVariants: [],
        tripPlans: [],
        partySize: undefined,
        defaultTimezone: undefined,
      },
    };
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(document));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.importItinerary(cockpitResponse.trip.id, "session-token", {
      fileName: "notes.md",
      contentType: "text/markdown",
      mode: "auto",
      content: "09:00 breakfast at Central",
    })).resolves.toEqual(normalizedDocument);

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/itinerary-imports`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify({
          fileName: "notes.md",
          contentType: "text/markdown",
          mode: "auto",
          content: "09:00 breakfast at Central",
        }),
      }),
    );
  });

  it("resolves place candidates through the trip-scoped place route", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({
      status: "resolved",
      candidates: [{
        name: "The Elements",
        address: "Austin Road West, Hong Kong",
        coordinates: { lat: 22.3049, lng: 114.1617 },
        mapLink: "https://www.openstreetmap.org/?mlat=22.3049000&mlon=114.1617000#map=17/22.3049000/114.1617000",
        confidence: 0.92,
        source: "nominatim",
        evidence: ["brave: The Elements"],
      }],
    }));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    expect(client.resolvePlace).toBeDefined();
    const result = await client.resolvePlace!(cockpitResponse.trip.id, "session-token", {
      clientMutationId: "resolve-web-1",
      activity: "Dim Dim Sum",
      placeHint: "ติ่มซำ แถว Elements",
      destinationLabel: "Hong Kong + Shenzhen",
      countries: ["HK"],
      day: "2026-06-19",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/places/resolve`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify({
          clientMutationId: "resolve-web-1",
          activity: "Dim Dim Sum",
          placeHint: "ติ่มซำ แถว Elements",
          destinationLabel: "Hong Kong + Shenzhen",
          countries: ["HK"],
          day: "2026-06-19",
        }),
      }),
    );
    expect(result.status).toBe("resolved");
    expect(result.candidates[0].coordinates).toEqual({ lat: 22.3049, lng: 114.1617 });
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
