import { describe, expect, it } from "vitest";
import { createLocalBookingDoc } from "./booking-docs";
import {
  bookingDocTestDocs as docs,
  createBookingDocTripFixture as tripFixture,
} from "./booking-docs.test-support";

describe("booking docs facade local creation", () => {
  it("builds local booking docs from app-provided context", () => {
    const trip = tripFixture([docs[0]]);

    expect(
      createLocalBookingDoc(
        trip,
        {
          type: "hotel",
          title: "  Draft title from form  ",
          status: "draft",
          visibility: "shared",
          ownerMemberId: "member-owner",
          providerName: "Joii Stay",
          confirmationCode: null,
          startsAt: "2026-06-18T15:00:00+08:00",
          endsAt: null,
          timezone: "Asia/Hong_Kong",
          priceAmount: 1200,
          currency: "HKD",
          travelerIds: ["member-owner"],
          externalLinks: [
            {
              id: "",
              label: "Voucher",
              url: "https://example.com/voucher",
              provider: null,
              accessNote: null,
            },
            {
              id: "link-existing",
              label: "Folder",
              url: "https://example.com/folder",
              provider: null,
              accessNote: null,
            },
          ],
          relatedItineraryItemIds: ["item-hotel"],
          relatedTaskIds: [],
          relatedExpenseIds: ["expense-hotel-deposit"],
          noteIds: [],
          notes: "Share confirmation after booking",
        },
        {
          title: "Draft title from form",
          tripPlanId: "plan-alt",
          createdBy: "member-owner",
          updatedAt: "2026-06-19T00:00:00.000Z",
          nextBookingDocId: (bookingDocs) => `booking-local-${bookingDocs.length + 1}`,
        },
      ),
    ).toMatchObject({
      id: "booking-local-2",
      tripId: "trip-1",
      tripPlanId: "plan-alt",
      title: "Draft title from form",
      createdBy: "member-owner",
      updatedAt: "2026-06-19T00:00:00.000Z",
      version: 1,
      externalLinks: [
        { id: "link-local-1", label: "Voucher" },
        { id: "link-existing", label: "Folder" },
      ],
    });
  });
});
