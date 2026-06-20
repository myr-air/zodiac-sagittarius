import { describe, expect, it } from "vitest";
import {
  buildPhotoAlbumSummary,
  filterPhotoAlbumLinks,
  findPhotoAlbumRelations,
  normalizePhotoAlbumCreateInput,
  safePhotoAlbumCoverHref,
  safePhotoAlbumHref,
  serializePhotoAlbumInputForApi,
} from "./photo-albums";
import {
  createPhotoAlbumTripFixture as tripFixture,
  photoAlbumTestAlbums as albums,
} from "./photo-albums.test-support";

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

  it("normalizes required photo album create fields before workspace commands", () => {
    expect(
      normalizePhotoAlbumCreateInput({
        access: "collaborative",
        provider: "google_photos",
        relatedItineraryItemIds: ["item-peak"],
        title: "  Peak album  ",
        url: "  https://photos.app.goo.gl/example  ",
      }),
    ).toMatchObject({
      title: "Peak album",
      url: "https://photos.app.goo.gl/example",
    });

    expect(
      normalizePhotoAlbumCreateInput({
        access: "collaborative",
        provider: "google_photos",
        relatedItineraryItemIds: [],
        title: " ",
        url: "https://photos.app.goo.gl/example",
      }),
    ).toBeNull();

    expect(
      normalizePhotoAlbumCreateInput({
        access: "collaborative",
        provider: "google_photos",
        relatedItineraryItemIds: [],
        title: "Peak album",
        url: " ",
      }),
    ).toBeNull();
  });

  it("finds creator, owner, and itinerary relations for the inspector", () => {
    const trip = tripFixture(albums);
    const relations = findPhotoAlbumRelations(albums[0], trip);

    expect(relations.createdBy?.displayName).toBe("Aom");
    expect(relations.owner?.displayName).toBe("Aom");
    expect(relations.itineraryItems.map((item) => item.activity)).toEqual(["Victoria Peak"]);
  });
});
