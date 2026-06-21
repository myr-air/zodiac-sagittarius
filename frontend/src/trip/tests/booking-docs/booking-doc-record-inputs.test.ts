import { describe, expect, it } from "vitest";
import {
  bookingDocInputFromRecord,
  bookingDocQuickFieldsInputFromRecord,
} from "../../booking-doc-record-inputs";
import { createBookingDocFixture as bookingDoc } from "./booking-docs.test-support";

describe("booking doc record inputs", () => {
  it("projects booking records back into editable input with explicit overrides", () => {
    const doc = bookingDoc({
      confirmationCode: "ABC123",
      providerName: "Ferry Co",
      tripPlanId: "plan-main",
    });

    expect(bookingDocInputFromRecord(doc, {
      confirmationCode: null,
      providerName: "Updated Ferry",
      relatedItineraryItemIds: ["item-pier"],
      type: "train",
    })).toEqual(expect.objectContaining({
      confirmationCode: null,
      providerName: "Updated Ferry",
      relatedItineraryItemIds: ["item-pier"],
      title: "Booking",
      tripPlanId: "plan-main",
      type: "train",
    }));
  });

  it("projects quick-field edits only when provider or confirmation changes", () => {
    const doc = bookingDoc({
      confirmationCode: "ABC123",
      providerName: "Ferry Co",
    });

    expect(bookingDocQuickFieldsInputFromRecord(doc, {})).toBeNull();
    expect(
      bookingDocQuickFieldsInputFromRecord(doc, {
        confirmationCode: null,
      }),
    ).toEqual(expect.objectContaining({
      confirmationCode: null,
      providerName: "Ferry Co",
      title: "Booking",
    }));
  });
});
