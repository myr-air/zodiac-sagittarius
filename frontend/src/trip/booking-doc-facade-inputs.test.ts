import { describe, expect, it } from "vitest";
import { bookingDocInputFromRecord } from "./booking-docs";
import { bookingDocTestDocs as docs } from "./booking-docs.test-support";

describe("booking docs facade inputs", () => {
  it("projects booking records back into editable input with explicit overrides", () => {
    expect(bookingDocInputFromRecord(docs[0], {
      confirmationCode: null,
      providerName: "Updated Airline",
      relatedItineraryItemIds: ["item-flight"],
      type: "train",
    })).toEqual(expect.objectContaining({
      confirmationCode: null,
      providerName: "Updated Airline",
      relatedItineraryItemIds: ["item-flight"],
      title: docs[0].title,
      tripPlanId: docs[0].tripPlanId,
      type: "train",
    }));
  });
});
