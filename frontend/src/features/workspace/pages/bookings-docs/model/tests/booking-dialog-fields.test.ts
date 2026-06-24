import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  bookingFlightTestDoc,
} from "../../testing/fixtures/bookings-docs-test-fixtures";
import {
  buildBookingDialogSubmitInput,
  initialBookingDialogFields,
} from "../booking-dialog-fields";

describe("booking dialog fields", () => {
  it("derives defaults for a new booking dialog", () => {
    expect(initialBookingDialogFields({ booking: null, trip: seedTrip })).toMatchObject({
      confirmationCode: "",
      currency: "HKD",
      externalUrl: "",
      noteIds: [],
      priceAmount: "",
      relatedExpenseIds: [],
      relatedItineraryItemIds: [],
      relatedTaskIds: [],
      status: "draft",
      title: "",
      travelerIds: [seedTrip.members[0].id],
      type: "flight",
      visibility: "shared",
    });
  });

  it("builds a trimmed submit input for new bookings", () => {
    const fields = {
      ...initialBookingDialogFields({ booking: null, trip: seedTrip }),
      externalUrl: " https://drive.example/booking ",
      notes: " Airport transfer ",
      priceAmount: "880",
      providerName: " MTR ",
      relatedExpenseIds: ["expense-airport"],
      relatedItineraryItemIds: ["item-flight"],
      relatedTaskIds: ["task-ticket"],
      status: "paid" as const,
      title: " Airport Express ",
      travelerIds: ["member-aom", "member-beam"],
      type: "public_transport" as const,
    };

    expect(buildBookingDialogSubmitInput({
      booking: null,
      externalLinkLabel: "External link",
      fields,
    })).toMatchObject({
      externalLinks: [
        {
          id: "link-local-1",
          label: "External link",
          provider: "MTR",
          url: "https://drive.example/booking",
        },
      ],
      notes: "Airport transfer",
      priceAmount: 880,
      providerName: "MTR",
      relatedExpenseIds: ["expense-airport"],
      relatedItineraryItemIds: ["item-flight"],
      relatedTaskIds: ["task-ticket"],
      timezone: "Asia/Hong_Kong",
      title: "Airport Express",
      travelerIds: ["member-aom", "member-beam"],
    });
  });

  it("preserves existing link identity, owner, and timezone for shared edits", () => {
    const fields = {
      ...initialBookingDialogFields({ booking: bookingFlightTestDoc, trip: seedTrip }),
      title: " Updated flight ",
    };

    expect(buildBookingDialogSubmitInput({
      booking: bookingFlightTestDoc,
      externalLinkLabel: "External link",
      fields,
    })).toMatchObject({
      externalLinks: [
        expect.objectContaining({ id: bookingFlightTestDoc.externalLinks[0].id }),
      ],
      ownerMemberId: bookingFlightTestDoc.ownerMemberId,
      timezone: bookingFlightTestDoc.timezone,
      title: "Updated flight",
    });
  });

  it("returns null for blank titles and assigns private owner from first traveler", () => {
    const fields = {
      ...initialBookingDialogFields({ booking: null, trip: seedTrip }),
      title: "   ",
      visibility: "private" as const,
    };

    expect(buildBookingDialogSubmitInput({
      booking: null,
      externalLinkLabel: "External link",
      fields,
    })).toBeNull();

    expect(buildBookingDialogSubmitInput({
      booking: null,
      externalLinkLabel: "External link",
      fields: {
        ...fields,
        title: "Passport",
        travelerIds: ["member-aom"],
      },
    })).toMatchObject({
      ownerMemberId: "member-aom",
      visibility: "private",
    });
  });
});
