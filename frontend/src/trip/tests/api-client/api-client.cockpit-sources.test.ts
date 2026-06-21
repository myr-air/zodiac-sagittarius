import { describe, expect, it } from "vitest";
import { mapCockpitResponse, type TripCockpitResponse } from "../../api-client";
import { cockpitResponse } from "../../testing/api-client-test-utils";

describe("Trip API cockpit source validation", () => {
  it("rejects cockpit payloads that omit the bookingDocs source of truth", () => {
    const responseWithoutBookingDocs = { ...cockpitResponse };
    delete (responseWithoutBookingDocs as Partial<TripCockpitResponse>).bookingDocs;

    expect(() => mapCockpitResponse(responseWithoutBookingDocs as unknown as TripCockpitResponse)).toThrow("bookingDocs");
  });

  it("rejects cockpit payloads that omit the photoAlbumLinks source of truth", () => {
    const responseWithoutPhotoAlbums = { ...cockpitResponse };
    delete (responseWithoutPhotoAlbums as Partial<TripCockpitResponse>).photoAlbumLinks;

    expect(() => mapCockpitResponse(responseWithoutPhotoAlbums as unknown as TripCockpitResponse)).toThrow("photoAlbumLinks");
  });
});
