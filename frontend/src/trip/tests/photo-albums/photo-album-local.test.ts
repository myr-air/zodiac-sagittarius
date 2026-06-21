import { describe, expect, it } from "vitest";
import {
  createLocalPhotoAlbum,
  updateLocalPhotoAlbum,
} from "../../photo-albums";
import {
  createPhotoAlbumTripFixture as tripFixture,
  photoAlbumTestAlbums as albums,
} from "./photo-albums.test-support";

describe("photo album local mutations", () => {
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
});
