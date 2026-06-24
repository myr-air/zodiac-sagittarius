import { describe, expect, it } from "vitest";
import {
  bookingDocTestDocs,
  bookingFlightTestDoc,
  bookingPassportTestDoc,
} from "../../testing/fixtures/bookings-docs-test-fixtures";
import {
  bookingDocMatchesFolder,
  bookingFolders,
  countBookingFolders,
  findBookingFolder,
} from "../booking-folders";

describe("booking folder rules", () => {
  it("defines stable cockpit folders for the booking rail", () => {
    expect(bookingFolders.map((folder) => folder.id)).toEqual([
      "all",
      "needs_action",
      "transport",
      "stays",
      "tickets",
      "travel_docs",
      "external_links",
    ]);
    expect(findBookingFolder("transport")).toMatchObject({ id: "transport" });
  });

  it("counts and matches booking docs by friendly folders", () => {
    const counts = countBookingFolders(bookingDocTestDocs);

    expect(counts.all).toBe(5);
    expect(counts.needs_action).toBe(2);
    expect(counts.transport).toBe(1);
    expect(counts.stays).toBe(1);
    expect(counts.tickets).toBe(1);
    expect(counts.travel_docs).toBe(2);
    expect(counts.external_links).toBe(4);
    expect(bookingDocMatchesFolder(bookingFlightTestDoc, "transport")).toBe(true);
    expect(bookingDocMatchesFolder(bookingPassportTestDoc, "external_links")).toBe(
      false,
    );
  });
});
