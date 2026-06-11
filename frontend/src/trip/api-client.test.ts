import { describe, expect, it, vi } from "vitest";
import { createTripApiClient, mapCockpitResponse, type TripCockpitResponse } from "./api-client";

const cockpitResponse: TripCockpitResponse = {
  trip: {
    id: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
    name: "Hong Kong + Shenzhen Trip",
    destinationLabel: "Hong Kong + Shenzhen",
    startDate: "2026-06-18",
    endDate: "2026-06-23",
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
    {
      id: "018f4e81-77a4-7b8f-b3bd-0d0f493ac562",
      tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
      displayName: "Beam",
      role: "organizer",
      accessStatus: "active",
      presence: "online",
      color: "#2563eb",
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
      pathGroupId: "group-breakfast",
      pathId: "path-rain",
      pathName: "Rain plan",
      pathRole: "alternative",
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
      details: {},
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
  expenses: [
    {
      id: "018f4e86-1111-7000-8000-000000000001",
      tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
      title: "Dim sum breakfast",
      amountMinor: 24000,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "Bring voucher.",
      receiptUrl: null,
      lineItems: [],
      comments: [
        {
          id: "comment-voucher",
          authorId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac562",
          body: "Voucher is in chat.",
          createdAt: "2026-06-05T12:00:00.000Z",
        },
      ],
      paidBy: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
      category: "food",
      splits: { "018f4e81-77a4-7b8f-b3bd-0d0f493ac561": 24000 },
      itineraryItemId: "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f",
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
  bookingDocs: [
    {
      id: "booking-api-flight",
      tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
      type: "flight",
      title: "API flight voucher",
      status: "confirmed",
      visibility: "shared",
      providerName: "Cathay",
      confirmationCode: "CX-API",
      startsAt: "2026-06-18T09:00:00+07:00",
      endsAt: null,
      timezone: "Asia/Bangkok",
      priceAmount: 24000,
      currency: "THB",
      travelerIds: ["018f4e81-77a4-7b8f-b3bd-0d0f493ac561"],
      relatedItineraryItemIds: ["018f4e83-5410-7d8b-8f25-fd52c5e7bd1f"],
      relatedTaskIds: ["018f4e84-1111-7000-8000-000000000001"],
      relatedExpenseIds: ["018f4e86-1111-7000-8000-000000000001"],
      noteIds: ["018f4e83-5410-7d8b-8f25-fd52c5e7bd30"],
      externalLinks: [
        {
          id: "booking-api-flight-link",
          label: "Drive",
          url: "https://drive.google.com/api-flight",
          provider: "Google Drive",
        },
      ],
      notes: "Stored externally.",
      createdBy: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
      ownerMemberId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
      updatedAt: "2026-05-29T00:00:00.000Z",
      version: 1,
    },
  ],
  photoAlbumLinks: [
    {
      id: "018f4e89-1111-7000-8000-000000000001",
      tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
      title: "API group album",
      provider: "google_photos",
      url: "https://photos.app.goo.gl/api-group",
      access: "collaborative",
      ownerMemberId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
      relatedItineraryItemIds: ["018f4e83-5410-7d8b-8f25-fd52c5e7bd1f"],
      day: "2026-06-18",
      description: "Shared trip album.",
      accessNote: "Everyone can add photos.",
      coverUrl: null,
      createdBy: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
      updatedAt: "2026-05-29T00:00:00.000Z",
      version: 1,
    },
  ],
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
      amount: 240,
      splits: { "018f4e81-77a4-7b8f-b3bd-0d0f493ac561": 240 },
    });
    expect(cockpit.trip.itineraryItems[0]).toMatchObject({
      pathGroupId: "group-breakfast",
      pathId: "path-rain",
      pathName: "Rain plan",
      pathRole: "alternative",
    });
    expect(cockpit.trip.bookingDocs?.[0]).toMatchObject({
      id: "booking-api-flight",
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
    };
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(document));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.importItinerary(cockpitResponse.trip.id, "session-token", {
      fileName: "notes.md",
      contentType: "text/markdown",
      mode: "auto",
      content: "09:00 breakfast at Central",
    })).resolves.toEqual(document);

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

  it("creates, patches, and deletes booking docs through trip-scoped routes", async () => {
    const createdBooking = {
      ...cockpitResponse.bookingDocs![0],
      id: "018f4e87-1111-7000-8000-000000000001",
      title: "Airport Express pass",
      version: 1,
    };
    const patchedBooking = {
      ...createdBooking,
      title: "Airport Express pass updated",
      version: 2,
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(createdBooking))
      .mockResolvedValueOnce(jsonResponse(patchedBooking))
      .mockResolvedValueOnce(jsonResponse(patchedBooking));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.createBookingDoc(cockpitResponse.trip.id, "session-token", {
      clientMutationId: "booking-create-1",
      type: "public_transport",
      title: "Airport Express pass",
      status: "booked",
      visibility: "shared",
      ownerMemberId: cockpitResponse.members[0].id,
      providerName: "MTR",
      confirmationCode: null,
      startsAt: null,
      endsAt: null,
      timezone: "Asia/Hong_Kong",
      priceAmount: 115,
      currency: "HKD",
      travelerIds: [cockpitResponse.members[0].id],
      externalLinks: [{ label: "Drive", url: "https://drive.google.com/pass", provider: "Google Drive", accessNote: null }],
      relatedItineraryItemIds: [cockpitResponse.itineraryItems[0].id],
      relatedTaskIds: [cockpitResponse.tasks[0].id],
      relatedExpenseIds: [cockpitResponse.expenses[0].id],
      noteIds: [cockpitResponse.stopNotes[0].id],
      notes: "Stored externally.",
    })).resolves.toMatchObject({ id: createdBooking.id, title: "Airport Express pass" });

    await expect(client.patchBookingDoc(cockpitResponse.trip.id, createdBooking.id, "session-token", {
      clientMutationId: "booking-patch-1",
      expectedVersion: 1,
      patch: { title: "Airport Express pass updated" },
    })).resolves.toMatchObject({ title: "Airport Express pass updated", version: 2 });

    await expect(client.deleteBookingDoc(cockpitResponse.trip.id, createdBooking.id, "session-token")).resolves.toMatchObject({
      id: createdBooking.id,
      version: 2,
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/bookings`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: expect.stringContaining("\"clientMutationId\":\"booking-create-1\""),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/bookings/${createdBooking.id}`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify({
          clientMutationId: "booking-patch-1",
          expectedVersion: 1,
          patch: { title: "Airport Express pass updated" },
        }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/bookings/${createdBooking.id}`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
  });

  it("creates, patches, and deletes photo albums through trip-scoped routes", async () => {
    const createdAlbum = {
      ...cockpitResponse.photoAlbumLinks![0],
      id: "018f4e89-1111-7000-8000-000000009999",
      title: "Group album",
      version: 1,
    };
    const patchedAlbum = {
      ...createdAlbum,
      title: "Group album updated",
      version: 2,
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(createdAlbum))
      .mockResolvedValueOnce(jsonResponse(patchedAlbum))
      .mockResolvedValueOnce(jsonResponse(patchedAlbum));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.createPhotoAlbum(cockpitResponse.trip.id, "session-token", {
      clientMutationId: "photo-album-create-1",
      title: "Group album",
      provider: "google_photos",
      url: "https://photos.app.goo.gl/group",
      access: "collaborative",
      ownerMemberId: cockpitResponse.members[0].id,
      relatedItineraryItemIds: [cockpitResponse.itineraryItems[0].id],
      day: "2026-06-18",
      description: "Trip album.",
      accessNote: "Everyone can add photos.",
      coverUrl: null,
    })).resolves.toMatchObject({ id: createdAlbum.id, title: "Group album" });

    await expect(client.patchPhotoAlbum(cockpitResponse.trip.id, createdAlbum.id, "session-token", {
      clientMutationId: "photo-album-patch-1",
      expectedVersion: 1,
      patch: { title: "Group album updated" },
    })).resolves.toMatchObject({ title: "Group album updated", version: 2 });

    await expect(client.deletePhotoAlbum(cockpitResponse.trip.id, createdAlbum.id, "session-token")).resolves.toMatchObject({
      id: createdAlbum.id,
      version: 2,
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/photo-albums`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: expect.stringContaining("\"clientMutationId\":\"photo-album-create-1\""),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/photo-albums/${createdAlbum.id}`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify({
          clientMutationId: "photo-album-patch-1",
          expectedVersion: 1,
          patch: { title: "Group album updated" },
        }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/photo-albums/${createdAlbum.id}`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
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
    vi.stubGlobal("fetch", fetchImpl);
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
    vi.unstubAllGlobals();
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
      trip: cockpitResponse.trip,
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

  it("falls back to an empty active plan id when the backend has no active or listed variant", () => {
    const cockpit = mapCockpitResponse({
      ...cockpitResponse,
      trip: { ...cockpitResponse.trip, activePlanVariantId: null },
      planVariants: [],
    });

    expect(cockpit.trip.activePlanVariantId).toBe("");
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

  it("creates patches and publishes plan variants through authenticated backend routes", async () => {
    const createdVariant = {
      id: "018f4e82-3000-7c00-b111-000000000099",
      tripId: cockpitResponse.trip.id,
      name: "Rain backup",
      kind: "backup" as const,
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
      version: 2,
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(createdVariant, 201))
      .mockResolvedValueOnce(jsonResponse(patchedVariant))
      .mockResolvedValueOnce(jsonResponse(publishedTrip));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });

    const created = await client.createPlanVariant(cockpitResponse.trip.id, "session-token", {
      clientMutationId: "web-plan-create-1",
      name: "Rain backup",
      kind: "backup",
      description: "Indoor route",
    });
    const patched = await client.patchPlanVariant(cockpitResponse.trip.id, created.id, "session-token", {
      clientMutationId: "web-plan-patch-1",
      expectedVersion: 1,
      patch: { name: "Rain day backup" },
    });
    const trip = await client.publishPlanVariant(cockpitResponse.trip.id, created.id, "session-token", {
      clientMutationId: "web-plan-publish-1",
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/plan-variants`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/plan-variants/${createdVariant.id}`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ clientMutationId: "web-plan-patch-1", expectedVersion: 1, patch: { name: "Rain day backup" } }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/plan-variants/${createdVariant.id}/publications`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ clientMutationId: "web-plan-publish-1" }),
      }),
    );
    expect(created).toMatchObject({ id: createdVariant.id, kind: "backup", version: 1 });
    expect(patched).toMatchObject({ name: "Rain day backup", version: 2 });
    expect(trip.activePlanVariantId).toBe(createdVariant.id);
    expect(trip.version).toBe(2);
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

  it("creates, patches, and deletes expenses through authenticated backend routes", async () => {
    const createdExpense = {
      ...cockpitResponse.expenses[0],
      id: "018f4e86-1111-7000-8000-000000000002",
      title: "Taxi",
      amountMinor: 12000,
      notes: "Airport pickup.",
      receiptUrl: "https://receipts.example/taxi.jpg",
      comments: [
        {
          id: "comment-created",
          authorId: cockpitResponse.members[1].id,
          body: "Paid from my cash wallet.",
          createdAt: "2026-06-05T12:00:00.000Z",
        },
      ],
      lineItems: [
        {
          id: "line-taxi",
          title: "Taxi van",
          amount: 120,
          participantIds: [cockpitResponse.members[0].id],
        },
      ],
      version: 1,
    };
    const patchedExpense = {
      ...createdExpense,
      title: "Taxi edited",
      amountMinor: 15000,
      notes: "Airport pickup edited.",
      receiptUrl: "https://receipts.example/taxi-edited.jpg",
      comments: [
        {
          id: "comment-created",
          authorId: cockpitResponse.members[1].id,
          body: "Paid from my cash wallet.",
          createdAt: "2026-06-05T12:00:00.000Z",
        },
        {
          id: "comment-edited",
          authorId: cockpitResponse.members[0].id,
          body: "Adjusted for toll.",
          createdAt: "2026-06-05T12:10:00.000Z",
        },
      ],
      lineItems: [
        {
          id: "line-taxi-edited",
          title: "Taxi van edited",
          amount: 150,
          participantIds: [cockpitResponse.members[0].id],
        },
      ],
      version: 2,
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(createdExpense, 201))
      .mockResolvedValueOnce(jsonResponse(patchedExpense))
      .mockResolvedValueOnce(jsonResponse(patchedExpense));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });
    const createRequest = {
      clientMutationId: "web-expense-1",
      title: "Taxi",
      amountMinor: 12000,
      currency: "CNY",
      exchangeRateToSettlementCurrency: 1.1,
      notes: "Airport pickup.",
      receiptUrl: "https://receipts.example/taxi.jpg",
      comments: [
        {
          id: "comment-created",
          authorId: cockpitResponse.members[1].id,
          body: "Paid from my cash wallet.",
          createdAt: "2026-06-05T12:00:00.000Z",
        },
      ],
      lineItems: [
        {
          id: "line-taxi",
          title: "Taxi van",
          amount: 120,
          participantIds: [cockpitResponse.members[0].id],
        },
      ],
      paidBy: cockpitResponse.members[0].id,
      category: "transport" as const,
      splits: { [cockpitResponse.members[0].id]: 12000 },
      itineraryItemId: cockpitResponse.itineraryItems[0].id,
    };
    const patchRequest = {
      clientMutationId: "web-expense-2",
      expectedVersion: 1,
      title: "Taxi edited",
      amountMinor: 15000,
      currency: "CNY",
      exchangeRateToSettlementCurrency: 1.1,
      notes: "Airport pickup edited.",
      receiptUrl: "https://receipts.example/taxi-edited.jpg",
      comments: [
        {
          id: "comment-created",
          authorId: cockpitResponse.members[1].id,
          body: "Paid from my cash wallet.",
          createdAt: "2026-06-05T12:00:00.000Z",
        },
        {
          id: "comment-edited",
          authorId: cockpitResponse.members[0].id,
          body: "Adjusted for toll.",
          createdAt: "2026-06-05T12:10:00.000Z",
        },
      ],
      lineItems: [
        {
          id: "line-taxi-edited",
          title: "Taxi van edited",
          amount: 150,
          participantIds: [cockpitResponse.members[0].id],
        },
      ],
      paidBy: cockpitResponse.members[0].id,
      category: "transport" as const,
      splits: { [cockpitResponse.members[0].id]: 15000 },
      itineraryItemId: cockpitResponse.itineraryItems[0].id,
    };

    const created = await client.createExpense(cockpitResponse.trip.id, "session-token", createRequest);
    const patched = await client.patchExpense(cockpitResponse.trip.id, created.id, "session-token", patchRequest);
    const deleted = await client.deleteExpense(cockpitResponse.trip.id, patched.id, "session-token");

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/expenses`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify(createRequest),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/expenses/${createdExpense.id}`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify(patchRequest),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/expenses/${patchedExpense.id}`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
    expect(created).toMatchObject({ id: createdExpense.id, title: "Taxi", amount: 120, notes: "Airport pickup.", comments: createdExpense.comments, version: 1 });
    expect(patched).toMatchObject({ id: createdExpense.id, title: "Taxi edited", amount: 150, version: 2 });
    expect(deleted).toMatchObject({ id: createdExpense.id, title: "Taxi edited", amount: 150, version: 2 });
  });

  it("records a payback reminder and receives refreshed settlement suggestions", async () => {
    const reminderSummary = {
      groupSpend: 240,
      netByMember: {
        [cockpitResponse.members[0].id]: 120,
        [cockpitResponse.members[1].id]: -120,
      },
      currentUserNetLabel: "You owe HK$120.00",
      settlementSuggestions: [
        {
          from: cockpitResponse.members[1].id,
          to: cockpitResponse.members[0].id,
          amount: 120,
          lastRemindedAt: "2026-06-05T12:00:00.000Z",
        },
      ],
    };
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(reminderSummary));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });
    const request = {
      clientMutationId: "web-expense-reminder-1",
      from: cockpitResponse.members[1].id,
      to: cockpitResponse.members[0].id,
      amountMinor: 12000,
    };

    const summary = await client.recordExpenseReminder(cockpitResponse.trip.id, "session-token", request);

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/expenses/reminders`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify(request),
      }),
    );
    expect(summary.settlementSuggestions[0]).toMatchObject({
      amount: 120,
      lastRemindedAt: "2026-06-05T12:00:00.000Z",
    });
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

    await expect(client.runPlanCheck?.(cockpitResponse.trip.id, "session-token")).resolves.toEqual(planCheck);
    await expect(client.latestPlanCheck?.(cockpitResponse.trip.id, "session-token")).resolves.toEqual(planCheck);
    await expect(client.patchPlanSuggestion?.(cockpitResponse.trip.id, "suggestion-1", "session-token", {
      expectedVersion: 1,
      status: "dismissed",
    })).resolves.toMatchObject({ status: "dismissed", version: 2 });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/plan-checks`,
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/plan-checks/latest`,
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
