import { describe, expect, it } from "vitest";
import {
  buildPhotoAlbumSummary,
  filterPhotoAlbumLinks,
  findPhotoAlbumRelations,
  safePhotoAlbumCoverHref,
  safePhotoAlbumHref,
  serializePhotoAlbumInputForApi,
} from "./photo-albums";
import type { ItineraryItem, Member, Trip, TripPhotoAlbumLink } from "./types";

const members: Member[] = [
  { id: "member-owner", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
  { id: "member-traveler", displayName: "Beam", role: "traveler", presence: "away", color: "#2563eb" },
];

const itineraryItems: ItineraryItem[] = [
  itineraryItem({ id: "item-peak", day: "2026-06-18", activity: "Victoria Peak", place: "Peak Tower" }),
  itineraryItem({ id: "item-ferry", day: "2026-06-19", activity: "Star Ferry", place: "Central Pier" }),
];

const albums: TripPhotoAlbumLink[] = [
  photoAlbum({
    id: "album-google",
    title: "Google Photos group album",
    provider: "google_photos",
    access: "collaborative",
    ownerMemberId: "member-owner",
    relatedItineraryItemIds: ["item-peak"],
    day: "2026-06-18",
    accessNote: "Everyone can add photos",
  }),
  photoAlbum({
    id: "album-dropbox",
    title: "Dropbox upload request",
    provider: "dropbox",
    access: "upload_request",
    url: "https://www.dropbox.com/request/example",
    ownerMemberId: "member-traveler",
    relatedItineraryItemIds: [],
    accessNote: null,
  }),
  photoAlbum({
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

describe("photo album helpers", () => {
  it("summarizes album access modes and missing access notes", () => {
    expect(buildPhotoAlbumSummary(albums)).toEqual({
      total: 3,
      collaborative: 1,
      uploadRequests: 1,
      missingAccessNotes: 2,
    });
  });

  it("filters by query, provider, access, and trip day", () => {
    expect(filterPhotoAlbumLinks(albums, { query: "group" }).map((album) => album.id)).toEqual(["album-google"]);
    expect(filterPhotoAlbumLinks(albums, { provider: "dropbox" }).map((album) => album.id)).toEqual(["album-dropbox"]);
    expect(filterPhotoAlbumLinks(albums, { access: "view_only" }).map((album) => album.id)).toEqual(["album-drive"]);
    expect(filterPhotoAlbumLinks(albums, { day: "2026-06-18" }).map((album) => album.id)).toEqual(["album-google"]);
  });

  it("blocks unsafe album URLs before rendering anchors", () => {
    expect(safePhotoAlbumHref("https://photos.app.goo.gl/example")).toBe("https://photos.app.goo.gl/example");
    expect(safePhotoAlbumHref("javascript:alert(1)")).toBeNull();
    expect(safePhotoAlbumHref("data:text/html;base64,PHNjcmlwdA==")).toBeNull();
  });

  it("allows same-origin cover assets while blocking unsafe cover URLs", () => {
    expect(safePhotoAlbumCoverHref("/landing/auth/photo-hong-kong-skyline.png")).toBe("/landing/auth/photo-hong-kong-skyline.png");
    expect(safePhotoAlbumCoverHref("https://images.example.test/cover.jpg")).toBe("https://images.example.test/cover.jpg");
    expect(safePhotoAlbumCoverHref("//evil.example.test/cover.jpg")).toBeNull();
    expect(safePhotoAlbumCoverHref("javascript:alert(1)")).toBeNull();
  });

  it("serializes photo album form values for the API boundary", () => {
    expect(
      serializePhotoAlbumInputForApi({
        access: "collaborative",
        accessNote: "  Everyone can add photos  ",
        coverUrl: "  https://images.example.test/cover.jpg  ",
        day: "  2026-06-18  ",
        description: "  Shared album  ",
        ownerMemberId: "member-owner",
        provider: "google_photos",
        relatedItineraryItemIds: ["item-peak"],
        title: "  Peak album  ",
        url: "  https://photos.app.goo.gl/example  ",
      }),
    ).toEqual({
      access: "collaborative",
      accessNote: "Everyone can add photos",
      coverUrl: "https://images.example.test/cover.jpg",
      day: "2026-06-18",
      description: "Shared album",
      ownerMemberId: "member-owner",
      provider: "google_photos",
      relatedItineraryItemIds: ["item-peak"],
      title: "Peak album",
      url: "https://photos.app.goo.gl/example",
    });

    expect(
      serializePhotoAlbumInputForApi({
        access: "view_only",
        accessNote: " ",
        coverUrl: "",
        day: "",
        description: " ",
        provider: "custom",
        relatedItineraryItemIds: [],
        title: "Album",
        url: "https://example.test",
      }),
    ).toMatchObject({
      accessNote: null,
      coverUrl: null,
      day: null,
      description: null,
    });
  });

  it("finds owner and itinerary relations for the inspector", () => {
    const trip = tripFixture(albums);
    const relations = findPhotoAlbumRelations(albums[0], trip);

    expect(relations.owner?.displayName).toBe("Aom");
    expect(relations.itineraryItems.map((item) => item.activity)).toEqual(["Victoria Peak"]);
  });
});

function photoAlbum(input: Partial<TripPhotoAlbumLink> & Pick<TripPhotoAlbumLink, "id" | "title">): TripPhotoAlbumLink {
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

function itineraryItem(input: Pick<ItineraryItem, "id" | "day" | "activity" | "place">): ItineraryItem {
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

function tripFixture(photoAlbumLinks: TripPhotoAlbumLink[]): Trip {
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
    members,
    itineraryItems,
    expenses: [],
    photoAlbumLinks,
  };
}
