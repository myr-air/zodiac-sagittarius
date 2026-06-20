import { describe, expect, it, vi } from "vitest";
import { createTripApiClient } from "./api-client";
import { cockpitResponse, jsonResponse } from "./api-client.test-support";

describe("Trip API client booking and photo routes", () => {
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
});
