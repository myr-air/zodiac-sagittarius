import type { TripPhotoAlbumLink } from "../types";

export function createSeedPhotoAlbumLinks({
  tripId,
  updatedAt,
}: {
  tripId: string;
  updatedAt: string;
}): TripPhotoAlbumLink[] {
  return [
    {
      id: "photo-album-google-group",
      tripId,
      title: "Google Photos group album",
      provider: "google_photos",
      url: "https://photos.app.goo.gl/hong-kong-shenzhen",
      access: "collaborative",
      ownerMemberId: "member-aom",
      relatedItineraryItemIds: ["item-victoria-peak", "item-dimdim"],
      day: "2026-06-18",
      description: "Main shared album for trip photos.",
      accessNote: "Everyone can add photos after joining the shared album.",
      coverUrl: null,
      createdBy: "member-aom",
      updatedAt,
      version: 1,
    },
    {
      id: "photo-album-dropbox-upload",
      tripId,
      title: "Dropbox upload request",
      provider: "dropbox",
      url: "https://www.dropbox.com/request/hong-kong-shenzhen",
      access: "upload_request",
      ownerMemberId: "member-beam",
      relatedItineraryItemIds: [],
      day: null,
      description: "Fallback upload destination for full-size files.",
      accessNote: "Use this if Google Photos upload is inconvenient.",
      coverUrl: null,
      createdBy: "member-beam",
      updatedAt,
      version: 1,
    },
  ];
}
