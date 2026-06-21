import { describe, expect, it } from "vitest";
import {
  tripPhotoAlbumAccessValues,
  tripPhotoAlbumProviderValues,
} from "../../trip-record-types";
import { expenseCategoryValues } from "../../expenses";
import {
  bookingDocStatusValues,
  bookingDocTypeValues,
  bookingDocVisibilityValues,
} from "../../booking-docs";

describe("trip record type values", () => {
  it("keeps expense and booking record enums in canonical display order", () => {
    expect(expenseCategoryValues).toEqual([
      "food",
      "transport",
      "tickets",
      "stay",
      "shopping",
      "settlement",
    ]);
    expect(bookingDocTypeValues).toEqual([
      "flight",
      "train",
      "public_transport",
      "hotel",
      "insurance",
      "passport",
      "visa",
      "activity_ticket",
      "other",
    ]);
    expect(bookingDocStatusValues).toEqual([
      "draft",
      "needs_action",
      "booked",
      "confirmed",
      "paid",
      "cancelled",
      "expired",
    ]);
    expect(bookingDocVisibilityValues).toEqual([
      "shared",
      "sensitive",
      "private",
    ]);
    expect(tripPhotoAlbumProviderValues).toEqual([
      "google_photos",
      "icloud",
      "google_drive",
      "dropbox",
      "onedrive",
      "custom",
    ]);
    expect(tripPhotoAlbumAccessValues).toEqual([
      "view_only",
      "collaborative",
      "upload_request",
    ]);
  });
});
