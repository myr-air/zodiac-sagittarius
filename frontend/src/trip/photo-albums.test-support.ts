import type { ItineraryItem, Member, Trip, TripPhotoAlbumLink } from "./types";

export const photoAlbumTestMembers: Member[] = [
  { id: "member-owner", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
  { id: "member-traveler", displayName: "Beam", role: "traveler", presence: "away", color: "#2563eb" },
];

export const photoAlbumTestItineraryItems: ItineraryItem[] = [
  createItineraryItemFixture({ id: "item-peak", day: "2026-06-18", activity: "Victoria Peak", place: "Peak Tower" }),
  createItineraryItemFixture({ id: "item-ferry", day: "2026-06-19", activity: "Star Ferry", place: "Central Pier" }),
];

export const photoAlbumTestAlbums: TripPhotoAlbumLink[] = [
  createPhotoAlbumFixture({
    id: "album-google",
    title: "Google Photos group album",
    provider: "google_photos",
    access: "collaborative",
    ownerMemberId: "member-owner",
    relatedItineraryItemIds: ["item-peak"],
    day: "2026-06-18",
    accessNote: "Everyone can add photos",
  }),
  createPhotoAlbumFixture({
    id: "album-dropbox",
    title: "Dropbox upload request",
    provider: "dropbox",
    access: "upload_request",
    url: "https://www.dropbox.com/request/example",
    ownerMemberId: "member-traveler",
    relatedItineraryItemIds: [],
    accessNote: null,
  }),
  createPhotoAlbumFixture({
    id: "album-drive",
    title: "Drive view-only selects",
    provider: "google_drive",
    access: "view_only",
    url: "https://drive.google.com/drive/folders/example",
    ownerMemberId: null,
    relatedItineraryItemIds: ["item-ferry"],
    day: "2026-06-19",
    accessNote: null,
  }),
];

export function createPhotoAlbumFixture(
  input: Partial<TripPhotoAlbumLink> & Pick<TripPhotoAlbumLink, "id" | "title">,
): TripPhotoAlbumLink {
  return {
    tripId: "trip-1",
    provider: "google_photos",
    url: "https://photos.app.goo.gl/example",
    access: "collaborative",
    ownerMemberId: "member-owner",
    relatedItineraryItemIds: [],
    day: null,
    description: null,
    accessNote: "Ask owner for access",
    coverUrl: null,
    createdBy: "member-owner",
    updatedAt: "2026-06-08T00:00:00.000Z",
    version: 1,
    ...input,
  };
}

export function createItineraryItemFixture(
  input: Pick<ItineraryItem, "id" | "day" | "activity" | "place">,
): ItineraryItem {
  return {
    tripId: "trip-1",
    planVariantId: "plan-main",
    sortOrder: 10,
    startTime: "10:00",
    activityType: "attraction",
    linkLabel: "Map",
    mapLink: "https://maps.example.test",
    durationMinutes: 60,
    transportation: "walk",
    details: {},
    note: "",
    createdBy: "member-owner",
    updatedAt: "2026-06-08T00:00:00.000Z",
    version: 1,
    ...input,
  };
}

export function createPhotoAlbumTripFixture(photoAlbumLinks: TripPhotoAlbumLink[]): Trip {
  return {
    id: "trip-1",
    joinId: "JOIN",
    joinPasswordHash: "hash",
    name: "Hong Kong",
    destinationLabel: "Hong Kong",
    startDate: "2026-06-18",
    endDate: "2026-06-20",
    activePlanVariantId: "plan-main",
    planVariants: [{ id: "plan-main", tripId: "trip-1", name: "Main", kind: "main", description: "" }],
    members: photoAlbumTestMembers,
    itineraryItems: photoAlbumTestItineraryItems,
    expenses: [],
    photoAlbumLinks,
  };
}
