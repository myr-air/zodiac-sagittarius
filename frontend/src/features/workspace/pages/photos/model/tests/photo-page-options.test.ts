import { describe, expect, it } from "vitest";
import {
  tripPhotoAlbumAccessValues,
  tripPhotoAlbumProviderValues,
} from "@/src/trip/photo-albums";
import { photoCopy } from "../../content/TripPhotosPage.copy";
import {
  photoAccessBadgeTone,
  photoAccessLabel,
  photoAccessSelectOptions,
  photoProviderIcon,
  photoProviderLabel,
  photoProviderSelectOptions,
  photoProviders,
} from "../photo-page-options";

describe("photo page options", () => {
  it("exports canonical provider and access option order", () => {
    expect(tripPhotoAlbumProviderValues).toEqual([
      "google_photos",
      "icloud",
      "google_drive",
      "dropbox",
      "onedrive",
      "custom",
    ]);
    expect(photoProviders).toEqual(["all", ...tripPhotoAlbumProviderValues]);
    expect(tripPhotoAlbumAccessValues).toEqual([
      "view_only",
      "collaborative",
      "upload_request",
    ]);
  });

  it("reads provider and access labels from page copy", () => {
    expect(photoProviderLabel("all", photoCopy.en)).toBe("All albums");
    expect(photoProviderLabel("google_drive", photoCopy.th)).toBe("Google Drive");
    expect(photoAccessLabel("upload_request", photoCopy.en)).toBe("Upload request");
  });

  it("builds dialog select options from the shared labels", () => {
    expect(photoProviderSelectOptions(photoCopy.en)[0]).toEqual({
      value: "google_photos",
      label: "Google Photos",
    });
    expect(photoAccessSelectOptions(photoCopy.th)).toEqual([
      { value: "view_only", label: photoCopy.th.accessLabels.view_only },
      { value: "collaborative", label: photoCopy.th.accessLabels.collaborative },
      { value: "upload_request", label: photoCopy.th.accessLabels.upload_request },
    ]);
  });

  it("keeps provider icons centralized for provider picker surfaces", () => {
    expect(photoProviderIcon("all")).toBe("layout");
    expect(photoProviderIcon("dropbox")).toBe("import");
    expect(photoProviderIcon("google_photos")).toBe("cloud");
    expect(photoProviderIcon("custom")).toBe("cloud");
  });

  it("keeps access badge tones centralized for album surfaces", () => {
    expect(photoAccessBadgeTone("collaborative")).toBe("primary");
    expect(photoAccessBadgeTone("upload_request")).toBe("warning");
    expect(photoAccessBadgeTone("view_only")).toBe("route");
  });
});
