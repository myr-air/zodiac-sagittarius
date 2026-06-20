import { describe, expect, it } from "vitest";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import { photoCopy } from "./TripPhotosPage.copy";
import {
  countPhotoProviders,
  photoAccessLabel,
  photoAccessOptions,
  photoAlbumLinkHost,
  photoProviderLabel,
  photoProviderOptions,
  photoProviders,
} from "./TripPhotosPage.support";

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

describe("TripPhotosPage support", () => {
  it("exports canonical provider and access option order", () => {
    expect(photoProviderOptions).toEqual([
      "google_photos",
      "icloud",
      "google_drive",
      "dropbox",
      "onedrive",
      "custom",
    ]);
    expect(photoProviders).toEqual(["all", ...photoProviderOptions]);
    expect(photoAccessOptions).toEqual([
      "view_only",
      "collaborative",
      "upload_request",
    ]);
  });

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

  it("reads provider and access labels from page copy", () => {
    expect(photoProviderLabel("all", photoCopy.en)).toBe("All albums");
    expect(photoProviderLabel("google_drive", photoCopy.th)).toBe("Google Drive");
    expect(photoAccessLabel("upload_request", photoCopy.en)).toBe("Upload request");
  });

  it("returns a host only for safe absolute album links", () => {
    expect(photoAlbumLinkHost("https://photos.example.com/trip/album")).toBe("photos.example.com");
    expect(photoAlbumLinkHost("ftp://photos.example.com/trip/album")).toBeNull();
    expect(photoAlbumLinkHost(null)).toBeNull();
    expect(photoAlbumLinkHost("not a url")).toBeNull();
  });
});
