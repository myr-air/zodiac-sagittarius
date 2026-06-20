import { describe, expect, it } from "vitest";
import {
  buildBookingDocsSummary,
  bookingDocLinkedContext,
  bookingDocMatchesQuery,
  canViewBookingDoc,
  compareBookingStartWithUndated,
  filterBookingDocs,
  findBookingDocRelations,
} from "./booking-docs";
import {
  bookingDocTestDocs as docs,
  bookingDocTestMembers as members,
  createBookingDocFixture as bookingDoc,
  createBookingDocTripFixture as tripFixture,
} from "./booking-docs.test-support";

describe("booking doc query helpers", () => {
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

  it("matches booking text, linked itinerary context, external links, and traveler names", () => {
    const trip = tripFixture(docs);
    const flight = {
      ...docs[0],
      externalLinks: [
        { id: "link-flight", label: "Airline portal", url: "https://flight.example", provider: "Airline", accessNote: "Use group code" },
      ],
    };

    expect(bookingDocMatchesQuery(flight, trip, "BKK")).toBe(true);
    expect(bookingDocMatchesQuery(flight, trip, "flight.example")).toBe(true);
    expect(bookingDocMatchesQuery(flight, trip, "Hong Kong")).toBe(true);
    expect(bookingDocMatchesQuery(flight, trip, "Owner")).toBe(true);
    expect(bookingDocMatchesQuery(flight, trip, "not in this booking")).toBe(false);
    expect(bookingDocLinkedContext(flight, trip)).toContain("BKK to HKG flight");
  });

  it("sorts dated bookings before undated bookings and then by title", () => {
    const dated = bookingDoc({
      id: "booking-dated",
      title: "Zoo dated",
      startsAt: "2026-06-18T09:00:00.000Z",
    });
    const undatedA = bookingDoc({ id: "booking-undated-a", title: "Alpha", startsAt: null });
    const undatedB = bookingDoc({ id: "booking-undated-b", title: "Beta", startsAt: null });

    expect([undatedB, dated, undatedA].sort(compareBookingStartWithUndated).map((doc) => doc.title)).toEqual([
      "Zoo dated",
      "Alpha",
      "Beta",
    ]);
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
});
