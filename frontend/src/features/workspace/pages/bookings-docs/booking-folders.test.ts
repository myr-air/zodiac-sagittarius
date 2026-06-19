import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  bookingDocMatchesFolder,
  bookingFolders,
  countBookingFolders,
} from "./booking-folders";

const bookingDocs = seedTrip.bookingDocs ?? [];

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
  });

  it("counts and matches booking docs by friendly folders", () => {
    const counts = countBookingFolders(bookingDocs);

    expect(counts.all).toBe(5);
    expect(counts.needs_action).toBe(2);
    expect(counts.transport).toBe(1);
    expect(counts.stays).toBe(1);
    expect(counts.tickets).toBe(1);
    expect(counts.travel_docs).toBe(2);
    expect(counts.external_links).toBe(4);
    expect(bookingDocMatchesFolder(bookingDocs.find((doc) => doc.id === "booking-flight-bkk-hkg")!, "transport")).toBe(true);
    expect(bookingDocMatchesFolder(bookingDocs.find((doc) => doc.id === "booking-passport-nam")!, "external_links")).toBe(false);
  });
});
