import type { TripCockpitResponse } from "../../api-client";

export const cockpitResponseStopNotes: TripCockpitResponse["stopNotes"] = [
  {
    id: "018f4e83-5410-7d8b-8f25-fd52c5e7bd30",
    tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
    tripPlanId: "018f4e82-3000-7c00-b111-000000000001",
    itemId: "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f",
    authorId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
    body: "Bring voucher",
    createdAt: "2026-05-29T00:00:00.000Z",
    updatedAt: "2026-05-29T00:00:00.000Z",
    version: 1,
  },
];

export const cockpitResponseExpenses: TripCockpitResponse["expenses"] = [
  {
    id: "018f4e86-1111-7000-8000-000000000001",
    tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
    tripPlanId: "018f4e82-3000-7c00-b111-000000000001",
    title: "Dim sum breakfast",
    amountMinor: 24000,
    currency: "HKD",
    exchangeRateToSettlementCurrency: 1,
    notes: "Bring voucher.",
    receiptUrl: null,
    lineItems: [],
    comments: [
      {
        id: "comment-voucher",
        authorId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac562",
        body: "Voucher is in chat.",
        createdAt: "2026-06-05T12:00:00.000Z",
      },
    ],
    settlementAllocations: [],
    paidBy: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
    category: "food",
    splits: { "018f4e81-77a4-7b8f-b3bd-0d0f493ac561": 24000 },
    itineraryItemId: "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f",
    version: 1,
  },
];

export const cockpitResponseTasks: TripCockpitResponse["tasks"] = [
  {
    id: "018f4e84-1111-7000-8000-000000000001",
    tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
    tripPlanId: "018f4e82-3000-7c00-b111-000000000001",
    title: "Buy eSIM",
    status: "open",
    visibility: "private",
    kind: "prep",
    createdBy: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
    assigneeId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
    relatedItemId: null,
    version: 1,
  },
];

export const cockpitResponseExpenseSummary: TripCockpitResponse["expenseSummary"] = {
  groupSpend: 0,
  netByMember: {},
  currentUserNetLabel: "settled",
  settlementSuggestions: [],
};

export const cockpitResponseBookingDocs: TripCockpitResponse["bookingDocs"] = [
  {
    id: "booking-api-flight",
    tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
    tripPlanId: "018f4e82-3000-7c00-b111-000000000001",
    type: "flight",
    title: "API flight voucher",
    status: "confirmed",
    visibility: "shared",
    providerName: "Cathay",
    confirmationCode: "CX-API",
    startsAt: "2026-06-18T09:00:00+07:00",
    endsAt: null,
    timezone: "Asia/Bangkok",
    priceAmount: 24000,
    currency: "THB",
    travelerIds: ["018f4e81-77a4-7b8f-b3bd-0d0f493ac561"],
    relatedItineraryItemIds: ["018f4e83-5410-7d8b-8f25-fd52c5e7bd1f"],
    relatedTaskIds: ["018f4e84-1111-7000-8000-000000000001"],
    relatedExpenseIds: ["018f4e86-1111-7000-8000-000000000001"],
    noteIds: ["018f4e83-5410-7d8b-8f25-fd52c5e7bd30"],
    externalLinks: [
      {
        id: "booking-api-flight-link",
        label: "Drive",
        url: "https://drive.google.com/api-flight",
        provider: "Google Drive",
      },
    ],
    notes: "Stored externally.",
    createdBy: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
    ownerMemberId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
    updatedAt: "2026-05-29T00:00:00.000Z",
    version: 1,
  },
];

export const cockpitResponsePhotoAlbumLinks: TripCockpitResponse["photoAlbumLinks"] = [
  {
    id: "018f4e89-1111-7000-8000-000000000001",
    tripId: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
    title: "API group album",
    provider: "google_photos",
    url: "https://photos.app.goo.gl/api-group",
    access: "collaborative",
    ownerMemberId: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
    relatedItineraryItemIds: ["018f4e83-5410-7d8b-8f25-fd52c5e7bd1f"],
    day: "2026-06-18",
    description: "Shared trip album.",
    accessNote: "Everyone can add photos.",
    coverUrl: null,
    createdBy: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561",
    updatedAt: "2026-05-29T00:00:00.000Z",
    version: 1,
  },
];
