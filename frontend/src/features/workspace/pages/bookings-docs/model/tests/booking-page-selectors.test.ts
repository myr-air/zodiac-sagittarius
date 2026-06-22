import { describe, expect, it } from "vitest";

import { seedTrip } from "@/src/trip/seed";
import { getTripFixtureMember } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  bookingDocTestDocs,
  bookingDocTestTasks,
  bookingFlightTestDoc,
} from "../../testing/fixtures/bookings-docs-test-fixtures";
import {
  filterBookingPageDocs,
  lockedBookingDocsForMember,
  selectedBookingPageDoc,
  selectedBookingPageRelations,
  visibleBookingDocsForMember,
} from "../booking-page-selectors";

describe("booking page selectors", () => {
  it("splits visible and locked docs for the current member", () => {
    const viewer = getTripFixtureMember("viewer");

    expect(
      visibleBookingDocsForMember(bookingDocTestDocs, viewer).map((doc) => doc.id),
    ).toEqual([
      "booking-flight-bkk-hkg",
      "booking-hotel-tst",
      "booking-peak-tram",
    ]);
    expect(
      lockedBookingDocsForMember(bookingDocTestDocs, viewer).map((doc) => doc.id),
    ).toEqual(["booking-passport-nam", "booking-group-insurance"]);
  });

  it("filters docs by folder, status, query, and stable booking order", () => {
    expect(
      filterBookingPageDocs({
        activeFolderId: "external_links",
        docs: bookingDocTestDocs,
        query: "Joii",
        statusFilter: "needs_action",
        trip: seedTrip,
      }).map((doc) => doc.id),
    ).toEqual(["booking-hotel-tst"]);
  });

  it("selects the requested doc or falls back to the first visible row", () => {
    expect(selectedBookingPageDoc(bookingDocTestDocs, bookingFlightTestDoc.id)).toBe(
      bookingFlightTestDoc,
    );
    expect(selectedBookingPageDoc(bookingDocTestDocs, "missing-booking")).toBe(
      bookingDocTestDocs[0],
    );
    expect(selectedBookingPageDoc([], "missing-booking")).toBeNull();
  });

  it("resolves selected booking relations from the page selector layer", () => {
    const relations = selectedBookingPageRelations({
      booking: bookingFlightTestDoc,
      tasks: bookingDocTestTasks,
      trip: seedTrip,
    });

    expect(relations?.itineraryItems.map((item) => item.id)).toEqual([
      "item-flight-bkk-hkg",
      "item-arrive-hkg",
    ]);
    expect(relations?.travelers.map((member) => member.id)).toEqual([
      "member-aom",
      "member-beam",
      "member-nam",
    ]);
    expect(selectedBookingPageRelations({
      booking: null,
      tasks: bookingDocTestTasks,
      trip: seedTrip,
    })).toBeNull();
  });
});
