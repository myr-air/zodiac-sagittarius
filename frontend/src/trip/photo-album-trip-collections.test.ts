import { describe, expect, it } from "vitest";
import {
  appendPhotoAlbumToTrip,
  removePhotoAlbumFromTrip,
  replacePhotoAlbumInTrip,
  updateLocalPhotoAlbumInTrip,
} from "./photo-albums";
import {
  createPhotoAlbumFixture as photoAlbum,
  createPhotoAlbumTripFixture as tripFixture,
  photoAlbumTestAlbums as albums,
} from "./photo-albums.test-support";

describe("photo album trip collections", () => {
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
