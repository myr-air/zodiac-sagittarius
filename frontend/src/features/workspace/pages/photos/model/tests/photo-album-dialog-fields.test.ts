import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { photoAlbumPageTestAlbums } from "../../testing/fixtures/photo-album-page-fixtures";
import {
  buildPhotoAlbumDialogSubmitInput,
  initialPhotoAlbumDialogFields,
  photoAlbumDialogDayOptions,
} from "../photo-album-dialog-fields";

const currentMember = seedTrip.members[0];

describe("photo album dialog fields", () => {
  it("derives defaults for a new album dialog", () => {
    expect(initialPhotoAlbumDialogFields({
      album: null,
      currentMember,
    })).toEqual({
      access: "collaborative",
      accessNote: "",
      day: "",
      description: "",
      ownerMemberId: currentMember.id,
      provider: "google_photos",
      relatedItineraryItemIds: [],
      title: "",
      url: "",
    });
  });

  it("derives sorted unique itinerary day options", () => {
    expect(photoAlbumDialogDayOptions({
      ...seedTrip,
      itineraryItems: [
        { ...seedTrip.itineraryItems[0]!, day: "2026-06-20" },
        { ...seedTrip.itineraryItems[1]!, day: "2026-06-18" },
        { ...seedTrip.itineraryItems[2]!, day: "2026-06-20" },
      ],
    })).toEqual(["2026-06-18", "2026-06-20"]);
  });

  it("builds trimmed submit input for new albums", () => {
    expect(buildPhotoAlbumDialogSubmitInput({
      album: null,
      fields: {
        ...initialPhotoAlbumDialogFields({ album: null, currentMember }),
        access: "view_only",
        accessNote: " Ask before sharing ",
        day: "2026-06-18",
        description: " Family photos ",
        provider: "icloud",
        relatedItineraryItemIds: ["item-victoria-peak"],
        title: " iCloud family album ",
        url: " https://icloud.example/album ",
      },
    })).toEqual({
      access: "view_only",
      accessNote: "Ask before sharing",
      coverUrl: null,
      day: "2026-06-18",
      description: "Family photos",
      ownerMemberId: currentMember.id,
      provider: "icloud",
      relatedItineraryItemIds: ["item-victoria-peak"],
      title: "iCloud family album",
      url: "https://icloud.example/album",
    });
  });

  it("preserves existing cover and normalizes optional blank fields", () => {
    const album = photoAlbumPageTestAlbums[0]!;

    expect(buildPhotoAlbumDialogSubmitInput({
      album,
      fields: {
        ...initialPhotoAlbumDialogFields({ album, currentMember }),
        accessNote: "  ",
        day: "",
        description: "  ",
        ownerMemberId: "",
        title: " Updated album ",
      },
    })).toMatchObject({
      accessNote: null,
      coverUrl: album.coverUrl,
      day: null,
      description: null,
      ownerMemberId: null,
      title: "Updated album",
    });
  });
});
