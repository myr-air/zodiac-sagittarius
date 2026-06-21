import { describe, expect, it } from "vitest";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import { countPhotoProviders, photoAlbumLinkHost } from "./photo-page-selectors";

const albumBase: Omit<TripPhotoAlbumLink, "id" | "provider"> = {
  tripId: "trip-1",
  title: "Shared photos",
  url: "https://photos.example.com/shared",
  access: "collaborative",
  relatedItineraryItemIds: [],
  createdBy: "member-1",
  updatedAt: "2026-01-01T00:00:00.000Z",
  version: 1,
};

function album(id: string, provider: TripPhotoAlbumLink["provider"]): TripPhotoAlbumLink {
  return { ...albumBase, id, provider };
}

describe("photo page selectors", () => {
  it("counts all photo providers from one album source", () => {
    expect(countPhotoProviders([
      album("photos-1", "google_photos"),
      album("photos-2", "google_photos"),
      album("photos-3", "dropbox"),
      album("photos-4", "custom"),
    ])).toEqual({
      all: 4,
      google_photos: 2,
      icloud: 0,
      google_drive: 0,
      dropbox: 1,
      onedrive: 0,
      custom: 1,
    });
  });

  it("returns a host only for safe absolute album links", () => {
    expect(photoAlbumLinkHost("https://photos.example.com/trip/album")).toBe("photos.example.com");
    expect(photoAlbumLinkHost("ftp://photos.example.com/trip/album")).toBeNull();
    expect(photoAlbumLinkHost(null)).toBeNull();
    expect(photoAlbumLinkHost("not a url")).toBeNull();
  });
});
