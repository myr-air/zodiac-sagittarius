import { describe, expect, it } from "vitest";
import {
  bookingDocInputFromRecord,
  buildBookingDocsSummary,
  canViewBookingDoc,
  clearItineraryBookingTicketDetails,
  createLocalBookingDoc,
  filterBookingDocs,
  findDuplicateBookingDoc,
  findBookingDocRelations,
  removeBookingDocFromTrip,
  replaceBookingDocInTrip,
  syncItineraryDetailsWithBookingTicket,
  updateLocalBookingDocInTrip,
  uniqueStringIds,
} from "./booking-docs";
import {
  bookingDocTestDocs as docs,
  bookingDocTestMembers as members,
  createBookingDocFixture as bookingDoc,
  createBookingDocTripFixture as tripFixture,
  createItineraryItemFixture as itineraryItem,
} from "./booking-docs.test-support";

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
