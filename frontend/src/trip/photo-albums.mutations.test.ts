import { describe, expect, it } from "vitest";
import {
  appendPhotoAlbumToTrip,
  buildCreatePhotoAlbumRequest,
  buildPatchPhotoAlbumRequest,
  createLocalPhotoAlbum,
  removePhotoAlbumFromTrip,
  replacePhotoAlbumInTrip,
  updateLocalPhotoAlbum,
  updateLocalPhotoAlbumInTrip,
} from "./photo-albums";
import {
  createPhotoAlbumFixture as photoAlbum,
  createPhotoAlbumTripFixture as tripFixture,
  photoAlbumTestAlbums as albums,
} from "./photo-albums.test-support";

describe("photo album mutation helpers", () => {
  it("builds create and patch photo album API requests", () => {
    const input = {
      access: "collaborative" as const,
      accessNote: "  Everyone can add photos  ",
      coverUrl: "  https://images.example.test/cover.jpg  ",
      day: "  2026-06-18  ",
      description: "  Shared album  ",
      ownerMemberId: "member-owner",
      provider: "google_photos" as const,
      relatedItineraryItemIds: ["item-peak"],
      title: "  Peak album  ",
      url: "  https://photos.app.goo.gl/example  ",
    };

    expect(
      buildCreatePhotoAlbumRequest(input, {
        clientMutationId: "photo-album-create-mutation",
      }),
    ).toMatchObject({
      clientMutationId: "photo-album-create-mutation",
      title: "Peak album",
      url: "https://photos.app.goo.gl/example",
      description: "Shared album",
    });
    expect(
      buildPatchPhotoAlbumRequest(input, {
        clientMutationId: "photo-album-patch-mutation",
        expectedVersion: 5,
      }),
    ).toMatchObject({
      clientMutationId: "photo-album-patch-mutation",
      expectedVersion: 5,
      patch: {
        title: "Peak album",
        url: "https://photos.app.goo.gl/example",
        description: "Shared album",
      },
    });
  });

  it("builds local photo albums from app-provided context", () => {
    const trip = tripFixture([albums[0]]);

    expect(
      createLocalPhotoAlbum(
        trip,
        {
          access: "upload_request",
          accessNote: "  Upload only  ",
          coverUrl: " https://images.example.test/cover.jpg ",
          day: "2026-06-19",
          description: "  Shared ferry photos  ",
          ownerMemberId: "member-traveler",
          provider: "dropbox",
          relatedItineraryItemIds: ["item-ferry"],
          title: "  Ferry uploads  ",
          url: "  https://www.dropbox.com/request/example  ",
        },
        {
          title: "Ferry uploads",
          url: "https://www.dropbox.com/request/example",
          createdBy: "member-owner",
          updatedAt: "2026-06-20T00:00:00.000Z",
          nextPhotoAlbumId: (existingAlbums) => `album-local-${existingAlbums.length + 1}`,
        },
      ),
    ).toMatchObject({
      id: "album-local-2",
      tripId: "trip-1",
      title: "Ferry uploads",
      url: "https://www.dropbox.com/request/example",
      description: "Shared ferry photos",
      accessNote: "Upload only",
      createdBy: "member-owner",
      updatedAt: "2026-06-20T00:00:00.000Z",
      version: 1,
    });
  });

  it("updates local photo albums while preserving immutable record fields", () => {
    expect(
      updateLocalPhotoAlbum(
        albums[0],
        {
          access: "view_only",
          accessNote: " ",
          description: "  Selects only  ",
          provider: "google_drive",
          relatedItineraryItemIds: ["item-ferry"],
          title: "  Drive selects  ",
          url: "  https://drive.google.com/drive/folders/example  ",
        },
        {
          title: "Drive selects",
          url: "https://drive.google.com/drive/folders/example",
          updatedAt: "2026-06-21T00:00:00.000Z",
        },
      ),
    ).toMatchObject({
      id: "album-google",
      tripId: "trip-1",
      access: "view_only",
      provider: "google_drive",
      title: "Drive selects",
      url: "https://drive.google.com/drive/folders/example",
      description: "Selects only",
      accessNote: null,
      createdBy: "member-owner",
      updatedAt: "2026-06-21T00:00:00.000Z",
      version: 2,
    });
  });

  it("appends, replaces, updates, and removes photo albums in trip collections", () => {
    const trip = tripFixture([albums[0], albums[1]]);
    const appended = appendPhotoAlbumToTrip(trip, albums[2]);

    expect(appended.photoAlbumLinks!.map((album) => album.id)).toEqual([
      "album-google",
      "album-dropbox",
      "album-drive",
    ]);
    expect(trip.photoAlbumLinks!.map((album) => album.id)).toEqual([
      "album-google",
      "album-dropbox",
    ]);

    const replacement = photoAlbum({
      id: "album-dropbox",
      title: "Dropbox selects",
      access: "view_only",
      provider: "dropbox",
    });
    const replaced = replacePhotoAlbumInTrip(appended, replacement);
    expect(
      replaced.photoAlbumLinks!.find((album) => album.id === "album-dropbox"),
    ).toMatchObject({
      title: "Dropbox selects",
      access: "view_only",
    });

    const updated = updateLocalPhotoAlbumInTrip(
      replaced,
      "album-google",
      {
        access: "view_only",
        accessNote: "  View only  ",
        description: "  Curated peak selects  ",
        provider: "google_drive",
        relatedItineraryItemIds: ["item-peak", "item-ferry"],
        title: "  Peak selects  ",
        url: "  https://drive.google.com/drive/folders/peak  ",
      },
      {
        title: "Peak selects",
        url: "https://drive.google.com/drive/folders/peak",
        updatedAt: "2026-06-22T00:00:00.000Z",
      },
    );
    expect(
      updated.photoAlbumLinks!.find((album) => album.id === "album-google"),
    ).toMatchObject({
      title: "Peak selects",
      url: "https://drive.google.com/drive/folders/peak",
      description: "Curated peak selects",
      accessNote: "View only",
      version: 2,
    });

    const removed = removePhotoAlbumFromTrip(updated, "album-dropbox");
    expect(removed.photoAlbumLinks!.map((album) => album.id)).toEqual([
      "album-google",
      "album-drive",
    ]);
  });
});
