import { describe, expect, it } from "vitest";

import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import {
  buildTicketFormValues,
  buildTicketSubmitInput,
  findLinkedTicket,
  findTicketCandidates,
} from "./booking-ticket-form";

const item: ItineraryItem = {
  id: "item-train",
  tripId: "trip-1",
  planVariantId: "plan-main",
  itemKind: "activity",
  timeMode: "scheduled",
  status: "planned",
  priority: "normal",
  day: "2026-06-19",
  sortOrder: 100,
  startTime: "09:15",
  endTime: "10:45",
  endOffsetDays: 0,
  activity: "Airport train",
  activityType: "travel",
  activitySubtype: "train",
  place: "Central Station",
  linkLabel: "",
  mapLink: "",
  durationMinutes: 90,
  transportation: "Airport Express",
  details: {
    provider: "MTR",
    bookingRef: "ABC123",
    from: "Airport",
    to: "Central",
  },
  note: "",
  createdBy: "member-1",
  updatedAt: "2026-06-01T00:00:00.000Z",
  version: 1,
};

function bookingDoc(input: Partial<BookingDoc> & Pick<BookingDoc, "id" | "title" | "type">): BookingDoc {
  return {
    id: input.id,
    tripId: "trip-1",
    tripPlanId: "plan-main",
    type: input.type,
    title: input.title,
    status: input.status ?? "draft",
    visibility: input.visibility ?? "shared",
    providerName: input.providerName ?? null,
    confirmationCode: input.confirmationCode ?? null,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    travelerIds: input.travelerIds ?? [],
    externalLinks: [],
    relatedItineraryItemIds: input.relatedItineraryItemIds ?? [],
    relatedTaskIds: [],
    relatedExpenseIds: [],
    noteIds: [],
    notes: input.notes ?? null,
    createdBy: "member-1",
    updatedAt: "2026-06-01T00:00:00.000Z",
    version: 1,
  };
}

describe("booking-ticket-form", () => {
  it("finds linked tickets and public transport candidates from nearby booking docs", () => {
    const linked = bookingDoc({
      id: "booking-linked",
      title: "Linked ferry ticket",
      type: "other",
      relatedItineraryItemIds: [item.id],
    });
    const flight = bookingDoc({
      id: "booking-flight",
      title: "Flight ticket",
      type: "flight",
    });
    const train = bookingDoc({
      id: "booking-train",
      title: "Train ticket",
      type: "train",
    });
    const hotel = bookingDoc({
      id: "booking-hotel",
      title: "Hotel",
      type: "hotel",
    });

    const candidates = findTicketCandidates(
      [linked, flight, train, hotel],
      item,
      "public_transport",
    );

    expect(candidates.map((booking) => booking.id)).toEqual([
      "booking-linked",
      "booking-flight",
      "booking-train",
    ]);
    expect(findLinkedTicket(candidates, item.id)).toBe(linked);
  });

  it("builds new ticket form values from itinerary details", () => {
    expect(
      buildTicketFormValues({
        booking: null,
        item,
        locale: "en",
        type: "train",
      }),
    ).toEqual({
      title: "Airport train train ticket",
      providerName: "MTR",
      confirmationCode: "ABC123",
      startsAt: "2026-06-19T09:15",
      endsAt: "2026-06-19T10:45",
      notes: "From itinerary\nFrom: Airport\nTo: Central\nAirport Express",
      relatedItineraryItemIds: [item.id],
    });
  });

  it("uses selected booking fields and trims submit values", () => {
    const selectedBooking = bookingDoc({
      id: "booking-train",
      title: "Existing train ticket",
      type: "train",
      status: "booked",
      visibility: "sensitive",
      travelerIds: ["member-1"],
      relatedItineraryItemIds: ["item-other"],
      startsAt: "2026-06-19T02:00:00.000Z",
      endsAt: "2026-06-19T03:00:00.000Z",
    });

    expect(
      buildTicketSubmitInput({
        item,
        mode: "existing",
        selectedBooking,
        selectedBookingId: selectedBooking.id,
        template: "train",
        type: "train",
        values: {
          title: "  Updated train ticket  ",
          providerName: "  MTR  ",
          confirmationCode: "  ABC123  ",
          startsAt: "2026-06-19T09:15",
          endsAt: "2026-06-19T10:45",
          notes: "  bring QR code  ",
          relatedItineraryItemIds: ["item-other", item.id],
        },
      }),
    ).toEqual({
      bookingDocId: selectedBooking.id,
      itemId: item.id,
      template: "train",
      type: "train",
      title: "Updated train ticket",
      status: "booked",
      visibility: "sensitive",
      providerName: "MTR",
      confirmationCode: "ABC123",
      startsAt: "2026-06-19T09:15",
      endsAt: "2026-06-19T10:45",
      travelerIds: ["member-1"],
      relatedItineraryItemIds: ["item-other", item.id],
      notes: "bring QR code",
    });
  });
});
