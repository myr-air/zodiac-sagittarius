import { describe, expect, it } from "vitest";
import {
  buildCreateBookingDocRequest,
  buildPatchBookingDocRequest,
  serializeBookingDocInputForApi,
} from "../../booking-docs";

describe("booking docs API requests", () => {
  it("serializes booking input for API patches", () => {
    expect(
      serializeBookingDocInputForApi({
        type: "flight",
        title: "  Morning flight  ",
        status: "draft",
        visibility: "shared",
        providerName: "  Airline  ",
        confirmationCode: "  ABC123  ",
        startsAt: "2026-06-18T09:00",
        endsAt: "2026-06-18T12:00",
        timezone: "Asia/Bangkok",
        priceAmount: null,
        currency: " HKD ",
        travelerIds: ["member-owner"],
        externalLinks: [
          {
            id: "not-a-uuid",
            label: "  Voucher  ",
            url: " https://example.com/voucher ",
            provider: " Drive ",
            accessNote: " Shared ",
          },
        ],
        relatedItineraryItemIds: ["item-flight"],
        relatedTaskIds: [],
        relatedExpenseIds: [],
        noteIds: [],
        notes: "  Check in online  ",
      }),
    ).toMatchObject({
      title: "Morning flight",
      startsAt: "2026-06-18T09:00:00+07:00",
      endsAt: "2026-06-18T12:00:00+07:00",
      providerName: "Airline",
      confirmationCode: "ABC123",
      timezone: "Asia/Bangkok",
      currency: "HKD",
      notes: "Check in online",
      externalLinks: [
        {
          label: "Voucher",
          url: "https://example.com/voucher",
          provider: "Drive",
          accessNote: "Shared",
        },
      ],
    });
  });

  it("builds patch booking doc API requests", () => {
    expect(
      buildPatchBookingDocRequest(
        {
          type: "hotel",
          title: "  Hotel voucher  ",
          status: "confirmed",
          visibility: "shared",
          providerName: " Joii Stay ",
          confirmationCode: " ABC123 ",
          startsAt: "2026-06-18T15:00",
          endsAt: null,
          timezone: "Asia/Hong_Kong",
          priceAmount: 1200,
          currency: " HKD ",
          travelerIds: ["member-owner"],
          externalLinks: [],
          relatedItineraryItemIds: ["item-hotel"],
          relatedTaskIds: [],
          relatedExpenseIds: [],
          noteIds: [],
          notes: "  Ready  ",
        },
        {
          clientMutationId: "booking-doc-patch-mutation",
          expectedVersion: 3,
        },
      ),
    ).toMatchObject({
      clientMutationId: "booking-doc-patch-mutation",
      expectedVersion: 3,
      patch: {
        title: "Hotel voucher",
        providerName: "Joii Stay",
        confirmationCode: "ABC123",
        startsAt: "2026-06-18T15:00:00+08:00",
        timezone: "Asia/Hong_Kong",
        currency: "HKD",
        notes: "Ready",
      },
    });
  });

  it("builds create booking doc API requests", () => {
    expect(
      buildCreateBookingDocRequest(
        {
          type: "activity_ticket",
          title: "  Museum tickets  ",
          status: "draft",
          visibility: "shared",
          providerName: " Museum ",
          confirmationCode: null,
          startsAt: "2026-06-19T10:00",
          endsAt: null,
          timezone: "Asia/Hong_Kong",
          priceAmount: null,
          currency: null,
          travelerIds: ["member-owner"],
          externalLinks: [],
          relatedItineraryItemIds: ["item-museum"],
          relatedTaskIds: [],
          relatedExpenseIds: [],
          noteIds: [],
          notes: "  Buy online  ",
          tripPlanId: "plan-rain",
        },
        {
          clientMutationId: "booking-doc-create-mutation",
        },
      ),
    ).toMatchObject({
      clientMutationId: "booking-doc-create-mutation",
      title: "Museum tickets",
      providerName: "Museum",
      startsAt: "2026-06-19T10:00:00+08:00",
      notes: "Buy online",
      tripPlanId: "plan-rain",
    });
  });
});
