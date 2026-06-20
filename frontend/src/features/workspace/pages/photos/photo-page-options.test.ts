import { describe, expect, it } from "vitest";
import { photoCopy } from "./TripPhotosPage.copy";
import {
  photoAccessLabel,
  photoAccessOptions,
  photoProviderLabel,
  photoProviderOptions,
  photoProviders,
} from "./photo-page-options";

describe("photo page options", () => {
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

  it("reads provider and access labels from page copy", () => {
    expect(photoProviderLabel("all", photoCopy.en)).toBe("All albums");
    expect(photoProviderLabel("google_drive", photoCopy.th)).toBe("Google Drive");
    expect(photoAccessLabel("upload_request", photoCopy.en)).toBe("Upload request");
  });
});
