import { describe, expect, it } from "vitest";
import {
  bookingDraftDetailsForItineraryItem,
  bookingDraftTimeWindowForItineraryItem,
  bookingDraftTitleForItineraryItem,
  bookingDocInputForExpenseEstimate,
  bookingTypeForBookingTemplate,
  bookingTypeForExpenseEstimate,
  bookingTypeForItineraryItem,
  buildBookingDocsSummary,
  canViewBookingDoc,
  clearItineraryBookingTicketDetails,
  createLocalBookingDoc,
  filterBookingDocs,
  findDuplicateBookingDoc,
  findBookingDocRelations,
  removeBookingDocFromTrip,
  replaceBookingDocInTrip,
  serializeBookingDocInputForApi,
  syncItineraryDetailsWithBookingTicket,
  updateLocalBookingDocInTrip,
  uniqueStringIds,
} from "./booking-docs";
import type { BookingDoc, Expense, ItineraryItem, Member, StopNote, Trip } from "./types";

const members: Member[] = [
  { id: "member-owner", displayName: "Owner", role: "owner", presence: "online", color: "#0f766e" },
  { id: "member-organizer", displayName: "Organizer", role: "organizer", presence: "online", color: "#2563eb" },
  { id: "member-traveler", displayName: "Traveler", role: "traveler", presence: "away", color: "#f97316" },
  { id: "member-viewer", displayName: "Viewer", role: "viewer", presence: "offline", color: "#64748b" },
];

const docs: BookingDoc[] = [
  bookingDoc({
    id: "booking-flight",
    type: "flight",
    title: "BKK to HKG flight",
    status: "confirmed",
    startsAt: "2026-06-18T09:00:00+07:00",
    priceAmount: 2180,
    currency: "HKD",
    travelerIds: ["member-owner", "member-traveler"],
    relatedItineraryItemIds: ["item-flight"],
    relatedExpenseIds: ["expense-flight"],
    relatedTaskIds: ["task-flight"],
  }),
  bookingDoc({
    id: "booking-passport",
    type: "passport",
    title: "Traveler passport",
    status: "needs_action",
    visibility: "sensitive",
    ownerMemberId: "member-traveler",
    startsAt: "2026-06-01T00:00:00+07:00",
    travelerIds: ["member-traveler"],
    relatedTaskIds: ["task-passport"],
  }),
  bookingDoc({
    id: "booking-hotel",
    type: "hotel",
    title: "Tsim Sha Tsui hotel",
    status: "paid",
    providerName: "Joii Stay",
    startsAt: "2026-06-18T15:00:00+08:00",
    endsAt: "2026-06-21T11:00:00+08:00",
    priceAmount: 5600,
    currency: "HKD",
    travelerIds: ["member-owner", "member-organizer", "member-traveler"],
    relatedItineraryItemIds: ["item-hotel"],
    relatedExpenseIds: ["expense-hotel-deposit", "expense-hotel-balance"],
  }),
];

describe("booking docs helpers", () => {
  it("summarizes booking cost, action items, sensitive readiness, and next upcoming item", () => {
    const summary = buildBookingDocsSummary(docs, members, "2026-06-10T00:00:00.000Z");

    expect(summary.totalCostByCurrency).toEqual({ HKD: 7780 });
    expect(summary.needsActionCount).toBe(1);
    expect(summary.sensitiveDocsTotal).toBe(1);
    expect(summary.sensitiveDocsReady).toBe(0);
    expect(summary.upcoming?.id).toBe("booking-flight");
  });

  it("applies role-aware visibility for shared, sensitive, and private records", () => {
    const passport = docs[1];
    const privateOwnerDoc = bookingDoc({
      id: "booking-private",
      title: "Owner-only cloud folder",
      visibility: "private",
      ownerMemberId: "member-owner",
      createdBy: "member-owner",
    });

    expect(canViewBookingDoc(docs[0], members[3])).toBe(true);
    expect(canViewBookingDoc(passport, members[0])).toBe(true);
    expect(canViewBookingDoc(passport, members[1])).toBe(true);
    expect(canViewBookingDoc(passport, members[2])).toBe(true);
    expect(canViewBookingDoc(passport, members[3])).toBe(false);
    expect(canViewBookingDoc(privateOwnerDoc, members[0])).toBe(true);
    expect(canViewBookingDoc(privateOwnerDoc, members[1])).toBe(false);
  });

  it("filters by search, type, status, traveler, date, and visibility", () => {
    const trip = tripFixture(docs);

    expect(filterBookingDocs(docs, { query: "hotel" }, trip, members[0]).map((doc) => doc.id)).toEqual(["booking-hotel"]);
    expect(filterBookingDocs(docs, { type: "flight" }, trip, members[0]).map((doc) => doc.id)).toEqual(["booking-flight"]);
    expect(filterBookingDocs(docs, { status: "needs_action" }, trip, members[0]).map((doc) => doc.id)).toEqual(["booking-passport"]);
    expect(filterBookingDocs(docs, { travelerId: "member-organizer" }, trip, members[0]).map((doc) => doc.id)).toEqual(["booking-hotel"]);
    expect(filterBookingDocs(docs, { day: "2026-06-18" }, trip, members[0]).map((doc) => doc.id)).toEqual(["booking-flight", "booking-hotel"]);
    expect(filterBookingDocs(docs, {}, trip, members[3]).map((doc) => doc.id)).toEqual(["booking-flight", "booking-hotel"]);
  });

  it("resolves linked itinerary items, tasks, expenses, notes, and travelers", () => {
    const trip = tripFixture(docs);
    const relations = findBookingDocRelations(docs[0], trip, [
      { id: "task-flight", title: "Check in online", status: "open", visibility: "shared", kind: "booking", createdBy: "member-owner" },
      { id: "task-passport", title: "Add passport number", status: "open", visibility: "shared", kind: "booking", createdBy: "member-organizer" },
    ]);

    expect(relations.itineraryItems.map((item) => item.id)).toEqual(["item-flight"]);
    expect(relations.tasks.map((task) => task.id)).toEqual(["task-flight"]);
    expect(relations.expenses.map((expense) => expense.id)).toEqual(["expense-flight"]);
    expect(relations.notes.map((note) => note.id)).toEqual(["note-flight"]);
    expect(relations.travelers.map((member) => member.id)).toEqual(["member-owner", "member-traveler"]);
  });

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

  it("replaces, updates, and removes booking docs in trip collections", () => {
    const trip = tripFixture([docs[0], docs[1]]);
    const replacement = { ...docs[0], title: "Updated flight" };
    const replacedTrip = replaceBookingDocInTrip(trip, replacement);
    const updatedTrip = updateLocalBookingDocInTrip(
      replacedTrip,
      docs[1].id,
      {
        type: "passport",
        title: "  Passport scan  ",
        status: "confirmed",
        visibility: "sensitive",
        ownerMemberId: "member-traveler",
        providerName: null,
        confirmationCode: null,
        startsAt: null,
        endsAt: null,
        timezone: null,
        priceAmount: null,
        currency: null,
        travelerIds: ["member-traveler"],
        externalLinks: [
          {
            id: "",
            label: "Vault",
            url: "https://example.com/vault",
            provider: null,
            accessNote: null,
          },
        ],
        relatedItineraryItemIds: [],
        relatedTaskIds: ["task-passport"],
        relatedExpenseIds: [],
        noteIds: [],
        notes: "Bring original passport.",
      },
      {
        title: "Passport scan",
        updatedAt: "2026-06-20T00:00:00.000Z",
      },
    );
    const removedTrip = removeBookingDocFromTrip(updatedTrip, docs[0].id);

    expect(replacedTrip.bookingDocs?.[0]).toBe(replacement);
    expect(updatedTrip.bookingDocs?.[1]).toMatchObject({
      id: docs[1].id,
      title: "Passport scan",
      updatedAt: "2026-06-20T00:00:00.000Z",
      version: docs[1].version + 1,
      externalLinks: [{ id: "link-local-1", label: "Vault" }],
    });
    expect(removedTrip.bookingDocs?.map((doc) => doc.id)).toEqual([docs[1].id]);
  });

  it("classifies itinerary rows and expense estimates into booking types", () => {
    const baseItem = itineraryItem("item-transfer", "รถรับส่งไปสนามบิน", "2026-06-18");

    expect(
      bookingTypeForItineraryItem({
        ...baseItem,
        activity: "บินไปฮ่องกง",
        transportation: "เครื่องบิน",
      }),
    ).toBe("flight");
    expect(
      bookingTypeForItineraryItem({
        ...baseItem,
        activity: "นั่งรถไฟเข้าเมือง",
        transportation: "รถไฟ",
      }),
    ).toBe("train");
    expect(
      bookingTypeForItineraryItem({
        ...baseItem,
        activity: "เช็คอินโรงแรม",
        activityType: "experience",
        itemKind: "activity",
        transportation: "",
      }),
    ).toBe("hotel");
    expect(bookingTypeForBookingTemplate("activity_ticket")).toBe("activity_ticket");
    expect(bookingTypeForExpenseEstimate({ category: "stay" } as Expense)).toBe("hotel");
    expect(bookingTypeForExpenseEstimate({ category: "transport" } as Expense)).toBe("public_transport");
  });

  it("builds booking estimate inputs from actual expenses", () => {
    const trip = tripFixture(docs);

    expect(
      bookingDocInputForExpenseEstimate(
        {
          id: "expense-hotel",
          title: "Hotel balance",
          amount: 4400,
          currency: "HKD",
          paidBy: "member-owner",
          category: "stay",
          splits: { "member-owner": 2200, "member-traveler": 2200 },
          itineraryItemId: "item-hotel",
          tripPlanId: null,
        },
        {
          currentMemberId: "member-owner",
          defaultTimezone: "Asia/Hong_Kong",
          members,
          itineraryItems: trip.itineraryItems,
          selectedTripPlanId: "plan-selected",
          mainTripPlanId: "plan-main",
          activePlanVariantId: "plan-active",
        },
      ),
    ).toEqual({
      tripPlanId: "plan-selected",
      type: "hotel",
      title: "Estimate: Hotel balance",
      status: "draft",
      visibility: "shared",
      ownerMemberId: "member-owner",
      providerName: null,
      confirmationCode: null,
      startsAt: null,
      endsAt: null,
      timezone: "Asia/Hong_Kong",
      priceAmount: 4400,
      currency: "HKD",
      travelerIds: members.map((member) => member.id),
      externalLinks: [],
      relatedItineraryItemIds: ["item-hotel"],
      relatedTaskIds: [],
      relatedExpenseIds: [],
      noteIds: [],
      notes: [
        "Plan estimate copied from an Actual Expense. This does not create or move real money.",
        "Source actual expense: Hotel balance",
      ].join("\n"),
    });
  });

  it("falls back to trip-level plan and HKD for expense booking estimates", () => {
    expect(
      bookingDocInputForExpenseEstimate(
        {
          id: "expense-snacks",
          title: "Snacks",
          amount: 120,
          paidBy: "member-owner",
          category: "food",
          splits: { "member-owner": 120 },
          itineraryItemId: "missing-item",
        },
        {
          currentMemberId: "member-owner",
          members,
          itineraryItems: [],
          mainTripPlanId: "plan-main",
          activePlanVariantId: "plan-active",
        },
      ),
    ).toMatchObject({
      tripPlanId: "plan-main",
      type: "other",
      currency: "HKD",
      timezone: null,
      relatedItineraryItemIds: [],
    });
  });

  it("builds booking drafts from itinerary details", () => {
    const item = {
      ...itineraryItem("item-ticket", "Peak Tram", "2026-06-18"),
      activityType: "attraction",
      place: "The Peak",
      startTime: "10:30",
      endTime: "12:00",
      details: {
        provider: "Peak Tram",
        bookingRef: "PK-123",
        entryWindow: "Enter before noon",
        costNote: "Group ticket",
      },
    } as ItineraryItem;

    expect(bookingDraftTitleForItineraryItem(item, "activity_ticket")).toBe(
      "Peak Tram ticket draft",
    );
    expect(bookingDraftDetailsForItineraryItem(item)).toEqual({
      providerName: "Peak Tram",
      confirmationCode: "PK-123",
      notes: "Draft from itinerary: The Peak\nEnter before noon\nGroup ticket",
    });
    expect(bookingDraftTimeWindowForItineraryItem(item)).toEqual({
      startsAt: "2026-06-18T10:30:00",
      endsAt: "2026-06-18T12:00:00",
    });
  });

  it("matches duplicate booking docs by normalized title, time, type, and itinerary item", () => {
    const duplicateTicket = bookingDoc({
      id: "booking-duplicate",
      type: "flight",
      title: "BKK to HKG flight",
      startsAt: "2026-06-18T09:00:00+07:00",
      relatedItineraryItemIds: ["item-flight"],
    });

    expect(
      findDuplicateBookingDoc([duplicateTicket], {
        type: "flight",
        title: " bkk to hkg flight ",
        status: "draft",
        visibility: "shared",
        startsAt: "2026-06-18T09:00+07:00",
        endsAt: null,
        travelerIds: [],
        externalLinks: [],
        relatedItineraryItemIds: ["item-flight"],
        relatedTaskIds: [],
        relatedExpenseIds: [],
        noteIds: [],
      }),
    ).toBe(duplicateTicket);
  });

  it("syncs and clears itinerary booking ticket details", () => {
    const item = itineraryItem("item-flight", "BKK to HKG flight", "2026-06-18");
    const details = syncItineraryDetailsWithBookingTicket(item, {
      itemId: item.id,
      template: "flight",
      type: "flight",
      title: "BKK to HKG flight ticket",
      status: "draft",
      visibility: "shared",
      providerName: "Cathay",
      confirmationCode: "CX123",
      startsAt: "2026-06-18T09:00:00+07:00",
      endsAt: "2026-06-18T12:55:00+08:00",
      travelerIds: ["member-owner"],
      relatedItineraryItemIds: [item.id],
      notes: null,
    });

    expect(details).toMatchObject({
      mode: "flight",
      provider: "Cathay",
      bookingRef: "CX123",
      ticketRef: "CX123",
      ticketStartsAt: "2026-06-18T09:00:00+07:00",
      ticketEndsAt: "2026-06-18T12:55:00+08:00",
    });
    expect(
      clearItineraryBookingTicketDetails({ ...item, details }),
    ).not.toHaveProperty("bookingRef");
    expect(uniqueStringIds(["a", "b", "a", ""])).toEqual(["a", "b"]);
  });
});

function bookingDoc(input: Partial<BookingDoc> & Pick<BookingDoc, "id" | "title">): BookingDoc {
  return {
    tripId: "trip-1",
    type: "other",
    status: "draft",
    visibility: "shared",
    ownerMemberId: null,
    providerName: null,
    confirmationCode: null,
    startsAt: null,
    endsAt: null,
    timezone: null,
    priceAmount: null,
    currency: null,
    travelerIds: [],
    externalLinks: [],
    relatedItineraryItemIds: [],
    relatedTaskIds: [],
    relatedExpenseIds: [],
    noteIds: [],
    notes: null,
    createdBy: "member-owner",
    updatedAt: "2026-06-01T00:00:00.000Z",
    version: 1,
    ...input,
  };
}

function tripFixture(bookingDocs: BookingDoc[]): Trip {
  const itineraryItems: ItineraryItem[] = [
    itineraryItem("item-flight", "BKK to HKG flight", "2026-06-18"),
    itineraryItem("item-hotel", "Hotel check-in", "2026-06-18"),
  ];
  const expenses: Expense[] = [
    { id: "expense-flight", title: "Flight fare", amount: 2180, paidBy: "member-owner", splits: {}, category: "transport" },
    { id: "expense-hotel-deposit", title: "Hotel deposit", amount: 1200, paidBy: "member-organizer", splits: {}, category: "stay" },
    { id: "expense-hotel-balance", title: "Hotel balance", amount: 4400, paidBy: "member-owner", splits: {}, category: "stay" },
  ];
  const stopNotes: StopNote[] = [
    { id: "note-flight", tripId: "trip-1", itemId: "item-flight", authorId: "member-owner", body: "Keep passport in carry-on.", createdAt: "2026-06-01T00:00:00.000Z" },
  ];

  return {
    id: "trip-1",
    joinId: "TRIP-1",
    joinPasswordHash: "hash",
    name: "Test trip",
    destinationLabel: "Hong Kong",
    startDate: "2026-06-18",
    endDate: "2026-06-21",
    activePlanVariantId: "plan-main",
    planVariants: [{ id: "plan-main", tripId: "trip-1", name: "Main", kind: "main", description: "Main plan" }],
    members,
    itineraryItems,
    expenses,
    expenseReminders: [],
    bookingDocs,
    stopNotes,
  };
}

function itineraryItem(id: string, activity: string, day: string): ItineraryItem {
  return {
    id,
    tripId: "trip-1",
    planVariantId: "plan-main",
    day,
    sortOrder: 100,
    startTime: "09:00",
    activity,
    activityType: "travel",
    place: "Hong Kong",
    linkLabel: "Map",
    mapLink: "https://maps.example.com",
    durationMinutes: 60,
    transportation: "Train",
    details: {},
    note: "",
    createdBy: "member-owner",
    updatedAt: "2026-06-01T00:00:00.000Z",
    version: 1,
  };
}
