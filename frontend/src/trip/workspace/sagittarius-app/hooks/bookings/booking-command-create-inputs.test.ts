import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { getTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { BookingDocInputLike } from "@/src/trip/booking-docs";
import { buildWorkspaceBookingDocCreateInput } from "./booking-command-create-inputs";

const linkedItem = getTripFixtureItineraryItem("item-dimdim");

function bookingDocInput(
  input: Partial<BookingDocInputLike>,
): BookingDocInputLike {
  return {
    type: "train",
    title: "Booking",
    status: "draft",
    visibility: "shared",
    travelerIds: [],
    externalLinks: [],
    relatedItineraryItemIds: [],
    relatedTaskIds: [],
    relatedExpenseIds: [],
    noteIds: [],
    ...input,
  };
}

describe("booking command create inputs", () => {
  it("trims title and resolves the linked itinerary item trip plan", () => {
    expect(
      buildWorkspaceBookingDocCreateInput(
        bookingDocInput({
          title: "  Airport train ticket  ",
          relatedItineraryItemIds: [linkedItem.id],
        }),
        {
          selectedTripPlanId: seedTrip.activePlanVariantId,
          trip: seedTrip,
        },
      ),
    ).toEqual({
      title: "Airport train ticket",
      tripPlanId: linkedItem.planVariantId,
    });
  });

  it("rejects blank booking titles", () => {
    expect(
      buildWorkspaceBookingDocCreateInput(
        bookingDocInput({
          title: "   ",
        }),
        {
          selectedTripPlanId: seedTrip.activePlanVariantId,
          trip: seedTrip,
        },
      ),
    ).toBeNull();
  });
});
