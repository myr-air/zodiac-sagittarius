import { describe, expect, it } from "vitest";
import {
  removeBookingDocFromTrip,
  replaceBookingDocInTrip,
  updateLocalBookingDocInTrip,
} from "./booking-docs";
import {
  bookingDocTestDocs as docs,
  createBookingDocTripFixture as tripFixture,
} from "./booking-docs.test-support";

describe("booking docs facade trip collections", () => {
  it("replaces, updates, and removes booking docs in trip collections", () => {
    const trip = tripFixture([docs[0], docs[1]]);
    const replacement = { ...docs[0], title: "Updated flight" };
    const replacedTrip = replaceBookingDocInTrip(trip, replacement);
    const updatedTrip = updateLocalBookingDocInTrip(
      replacedTrip,
      docs[1].id,
      {
        type: "passport",
        title: "  Passport scan  ",
        status: "confirmed",
        visibility: "sensitive",
        ownerMemberId: "member-traveler",
        providerName: null,
        confirmationCode: null,
        startsAt: null,
        endsAt: null,
        timezone: null,
        priceAmount: null,
        currency: null,
        travelerIds: ["member-traveler"],
        externalLinks: [
          {
            id: "",
            label: "Vault",
            url: "https://example.com/vault",
            provider: null,
            accessNote: null,
          },
        ],
        relatedItineraryItemIds: [],
        relatedTaskIds: ["task-passport"],
        relatedExpenseIds: [],
        noteIds: [],
        notes: "Bring original passport.",
      },
      {
        title: "Passport scan",
        updatedAt: "2026-06-20T00:00:00.000Z",
      },
    );
    const removedTrip = removeBookingDocFromTrip(updatedTrip, docs[0].id);

    expect(replacedTrip.bookingDocs?.[0]).toBe(replacement);
    expect(updatedTrip.bookingDocs?.[1]).toMatchObject({
      id: docs[1].id,
      title: "Passport scan",
      updatedAt: "2026-06-20T00:00:00.000Z",
      version: docs[1].version + 1,
      externalLinks: [{ id: "link-local-1", label: "Vault" }],
    });
    expect(removedTrip.bookingDocs?.map((doc) => doc.id)).toEqual([docs[1].id]);
  });
});
