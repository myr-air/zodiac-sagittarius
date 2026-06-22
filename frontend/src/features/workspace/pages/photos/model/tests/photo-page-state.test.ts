import { describe, expect, it } from "vitest";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import {
  initialPhotoAlbumBrowserState,
  initialPhotoAlbumModalState,
  updatePhotoAlbumBrowserState,
  updatePhotoAlbumModalState,
} from "../photo-page-state";

const photoAlbumLinks = [
  { id: "album-google" },
  { id: "album-icloud" },
] as TripPhotoAlbumLink[];

describe("photo page state", () => {
  it("initializes browser and modal state from current photo albums", () => {
    expect(initialPhotoAlbumBrowserState(photoAlbumLinks)).toEqual({
      activeProvider: "all",
      selectedAlbumId: "album-google",
    });
    expect(initialPhotoAlbumBrowserState([]).selectedAlbumId).toBe("");
    expect(initialPhotoAlbumModalState).toEqual({
      deleteAlbum: null,
      dialogAlbum: null,
    });
  });

  it("updates browser state without mutating current state", () => {
    const state = initialPhotoAlbumBrowserState(photoAlbumLinks);
    const nextState = updatePhotoAlbumBrowserState(
      state,
      "activeProvider",
      "google_photos",
    );

    expect(nextState).toEqual({
      activeProvider: "google_photos",
      selectedAlbumId: "album-google",
    });
    expect(state.activeProvider).toBe("all");
  });

  it("updates modal state without mutating current state", () => {
    const nextState = updatePhotoAlbumModalState(
      initialPhotoAlbumModalState,
      "dialogAlbum",
      "new",
    );

    expect(nextState).toEqual({
      deleteAlbum: null,
      dialogAlbum: "new",
    });
    expect(initialPhotoAlbumModalState.dialogAlbum).toBeNull();
  });
});
