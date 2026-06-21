import { describe, expect, it } from "vitest";
import {
  createLocalBookingDoc,
  normalizeBookingDocTitle,
  removeBookingDocFromTrip,
  replaceBookingDocInTrip,
  resolveBookingDocCreateTripPlanId,
  updateLocalBookingDocInTrip,
} from "../../booking-doc-local";
import { bookingDocInputFromRecord } from "../../booking-doc-record-inputs";
import { createBookingDocFixture as bookingDoc } from "./booking-docs.test-support";

describe("booking doc local trip mutations", () => {
  it("creates and updates local booking docs without mutating the trip", () => {
    const trip = { id: "trip-hk", bookingDocs: [bookingDoc({ id: "booking-1" })] };
    const input = bookingDocInputFromRecord(trip.bookingDocs[0], {
      externalLinks: [{ id: "", label: "Voucher", url: "https://example.com", provider: null, accessNote: null }],
      title: "Updated voucher",
    });

    const created = createLocalBookingDoc(trip, input, {
      createdBy: "member-owner",
      nextBookingDocId: () => "booking-2",
      title: "Local voucher",
      tripPlanId: "plan-main",
      updatedAt: "2026-06-19T12:00:00.000Z",
    });
    const updatedTrip = updateLocalBookingDocInTrip(
      { ...trip, bookingDocs: [...trip.bookingDocs, created] },
      "booking-2",
      input,
      { title: "Updated voucher", updatedAt: "2026-06-20T12:00:00.000Z" },
    );

    expect(created).toMatchObject({
      id: "booking-2",
      title: "Local voucher",
      tripId: "trip-hk",
      tripPlanId: "plan-main",
      version: 1,
    });
    expect(created.externalLinks[0]?.id).toBe("link-local-1");
    expect(trip.bookingDocs).toHaveLength(1);
    expect(updatedTrip.bookingDocs.find((doc) => doc.id === "booking-2")).toMatchObject({
      title: "Updated voucher",
      updatedAt: "2026-06-20T12:00:00.000Z",
      version: 2,
    });
  });

  it("replaces and removes booking docs immutably", () => {
    const original = bookingDoc({ id: "booking-1", title: "Original" });
    const replacement = bookingDoc({ id: "booking-1", title: "Replacement" });
    const trip = { bookingDocs: [original, bookingDoc({ id: "booking-2" })] };

    const replaced = replaceBookingDocInTrip(trip, replacement);
    const removed = removeBookingDocFromTrip(replaced, "booking-2");

    expect(replaced.bookingDocs[0]).toBe(replacement);
    expect(trip.bookingDocs[0]).toBe(original);
    expect(removed.bookingDocs.map((doc) => doc.id)).toEqual(["booking-1"]);
  });

  it("normalizes create titles and resolves booking create trip plans through one helper", () => {
    const trip = {
      activePlanVariantId: "plan-active",
      itineraryItems: [{ id: "item-rain", planVariantId: "plan-rain" }],
      mainTripPlanId: "plan-main",
    };
    const input = bookingDocInputFromRecord(bookingDoc(), {
      relatedItineraryItemIds: ["item-rain"],
      title: "  Ferry ticket  ",
      tripPlanId: null,
    });
    const calls: Array<{
      preferredTripPlanId?: string | null;
      relatedItineraryItemIds: string[];
    }> = [];

    const tripPlanId = resolveBookingDocCreateTripPlanId(trip, input, {
      selectedTripPlanId: "plan-selected",
      resolveTripPlanId: (_trip, bookingInput, preferredTripPlanId) => {
        calls.push({
          preferredTripPlanId,
          relatedItineraryItemIds: bookingInput.relatedItineraryItemIds,
        });
        return "plan-rain";
      },
    });

    expect(normalizeBookingDocTitle(input)).toBe("Ferry ticket");
    expect(tripPlanId).toBe("plan-rain");
    expect(calls).toEqual([
      {
        preferredTripPlanId: "plan-selected",
        relatedItineraryItemIds: ["item-rain"],
      },
    ]);
  });

  it("preserves explicit booking create trip plan ids ahead of selected plan fallback", () => {
    const trip = {
      activePlanVariantId: "plan-active",
      itineraryItems: [],
      mainTripPlanId: "plan-main",
    };

    expect(
      resolveBookingDocCreateTripPlanId(
        trip,
        bookingDocInputFromRecord(bookingDoc(), {
          tripPlanId: "plan-explicit",
        }),
        {
          selectedTripPlanId: "plan-selected",
          resolveTripPlanId: (_trip, _input, preferredTripPlanId) =>
            preferredTripPlanId,
        },
      ),
    ).toBe("plan-explicit");
  });

});
