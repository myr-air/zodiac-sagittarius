import { describe, expect, it } from "vitest";
import { photoCopy } from "../../content/TripPhotosPage.copy";
import {
  photoAlbumAccessNoteDisplay,
  photoAlbumDayDisplay,
  photoAlbumHostDisplay,
  photoAlbumOwnerDisplay,
  photoAlbumSummaryDisplay,
} from "../photo-album-display";

describe("photo album display helpers", () => {
  it("centralizes photo album fallback labels", () => {
    expect(photoAlbumSummaryDisplay({
      accessNote: "Everyone can add photos",
      description: "Shared album",
    }, photoCopy.en)).toBe("Everyone can add photos");
    expect(photoAlbumSummaryDisplay({
      accessNote: null,
      description: "Shared album",
    }, photoCopy.en)).toBe("Shared album");
    expect(photoAlbumSummaryDisplay({
      accessNote: null,
      description: null,
    }, photoCopy.en)).toBe(photoCopy.en.defaultAccessNote);

    expect(photoAlbumAccessNoteDisplay({ accessNote: null }, photoCopy.en)).toBe(photoCopy.en.noAccessNote);
    expect(photoAlbumAccessNoteDisplay({ accessNote: "Ask Aom for upload access" }, photoCopy.en)).toBe("Ask Aom for upload access");
    expect(photoAlbumDayDisplay(null, photoCopy.en)).toBe(photoCopy.en.tripLevel);
    expect(photoAlbumDayDisplay("2026-06-18", photoCopy.en)).toBe("2026-06-18");
    expect(photoAlbumHostDisplay(null, photoCopy.en)).toBe(photoCopy.en.blockedLink);
    expect(photoAlbumHostDisplay("photos.example.com", photoCopy.en)).toBe("photos.example.com");
    expect(photoAlbumOwnerDisplay(null, photoCopy.en.noOwner)).toBe(photoCopy.en.noOwner);
    expect(photoAlbumOwnerDisplay({ displayName: "Aom" }, photoCopy.en.noOwner)).toBe("Aom");
  });
});
