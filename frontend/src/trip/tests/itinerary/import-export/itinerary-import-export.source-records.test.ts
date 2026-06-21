import { describe, expect, it } from "vitest";
import {
  buildItineraryExport,
  parseItineraryImportDocument,
} from "../../../itinerary-import-export";
import { tripFixture } from "../../../trip-fixtures";

describe("itinerary import/export source records", () => {
  it("preserves actual expense and paid booking records as source references without remapping ids", () => {
    const selectedPlanId = "plan-client-draft";
    const selectedItem = {
      ...tripFixture.planItems[0],
      id: "draft-flight-window",
      planVariantId: selectedPlanId,
    };
    const paidExpense = {
      ...tripFixture.trip.expenses[0],
      id: "expense-paid-source",
      tripId: tripFixture.trip.id,
      tripPlanId: selectedPlanId,
      itineraryItemId: selectedItem.id,
      title: "Paid source ticket",
      amount: 4200,
      amountMinor: 420000,
      currency: "THB",
      version: 9,
    };
    const paidBooking = {
      ...(tripFixture.trip.bookingDocs ?? [])[0],
      id: "booking-paid-source",
      tripId: tripFixture.trip.id,
      tripPlanId: selectedPlanId,
      title: "Paid source flight booking",
      status: "paid" as const,
      relatedItineraryItemIds: [selectedItem.id],
      relatedExpenseIds: [paidExpense.id],
      version: 4,
    };

    const exported = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [selectedItem],
      trip: {
        ...tripFixture.trip,
        activePlanVariantId: tripFixture.trip.activePlanVariantId,
        mainTripPlanId: tripFixture.trip.activePlanVariantId,
        expenses: [paidExpense],
        bookingDocs: [paidBooking],
      },
    });
    const parsed = parseItineraryImportDocument(JSON.stringify(exported));

    expect(parsed.trip.mainTripPlanId).toBe(tripFixture.trip.activePlanVariantId);
    expect(parsed.records?.expenses).toEqual([paidExpense]);
    expect(parsed.records?.bookingDocs).toEqual([paidBooking]);
    expect(parsed.records?.bookingDocs[0]).toMatchObject({
      id: "booking-paid-source",
      status: "paid",
      relatedExpenseIds: ["expense-paid-source"],
      relatedItineraryItemIds: ["draft-flight-window"],
      tripPlanId: selectedPlanId,
    });
  });
});
