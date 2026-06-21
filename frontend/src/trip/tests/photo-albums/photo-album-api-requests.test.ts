import { describe, expect, it } from "vitest";
import {
  buildCreatePhotoAlbumRequest,
  buildPatchPhotoAlbumRequest,
} from "../../photo-albums";

describe("photo album API requests", () => {
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
});
