import { describe, expect, it } from "vitest";
import {
  selectTripPlanRecords,
  tripPlanIdForBookingRecord,
  tripPlanIdForRecord,
} from "./trip-plan-records";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type { BookingDoc, Expense, StopNote, Trip, TripTask } from "@/src/trip/types";

function tripWithRecordFixtures(): {
  backupItemId: string;
  mainItemId: string;
  records: {
    stopNotes: StopNote[];
    tasks: TripTask[];
  };
  trip: Trip;
} {
  const mainItem = tripFixture.trip.itineraryItems[0];
  const backupItem = {
    ...mainItem,
    id: "item-backup-museum",
    planVariantId: "plan-backup",
  };
  const mainExpense: Expense = {
    amount: 10,
    category: "food",
    id: "expense-main",
    itineraryItemId: mainItem.id,
    paidBy: "member-aom",
    splits: {},
    title: "Main breakfast",
    tripPlanId: null,
  };
  const backupExpense: Expense = {
    ...mainExpense,
    id: "expense-backup",
    itineraryItemId: backupItem.id,
    title: "Backup museum",
  };
  const unlinkedMainExpense: Expense = {
    ...mainExpense,
    id: "expense-unlinked-main",
    itineraryItemId: null,
    title: "Shared main estimate",
    tripPlanId: null,
  };
  const backupBooking: BookingDoc = {
    confirmationCode: null,
    createdBy: "member-aom",
    currency: "HKD",
    endsAt: null,
    externalLinks: [],
    id: "booking-backup",
    noteIds: [],
    notes: "",
    ownerMemberId: "member-aom",
    priceAmount: null,
    providerName: null,
    relatedExpenseIds: [],
    relatedItineraryItemIds: [backupItem.id],
    relatedTaskIds: [],
    startsAt: null,
    status: "draft",
    timezone: "Asia/Hong_Kong",
    title: "Backup ticket",
    travelerIds: ["member-aom"],
    tripId: tripFixture.trip.id,
    tripPlanId: null,
    type: "activity_ticket",
    updatedAt: "2026-06-16T00:00:00.000Z",
    version: 1,
    visibility: "shared",
  };
  const backupNote: StopNote = {
    authorId: "member-aom",
    body: "Backup route note",
    createdAt: "2026-06-16T00:00:00.000Z",
    id: "note-backup",
    itemId: backupItem.id,
    tripId: tripFixture.trip.id,
    tripPlanId: null,
  };
  const mainTask: TripTask = {
    createdBy: "member-aom",
    id: "task-main-explicit",
    relatedItemId: null,
    status: "open",
    title: "Main task",
    tripPlanId: tripFixture.trip.activePlanVariantId,
    visibility: "shared",
  };
  const backupTask: TripTask = {
    ...mainTask,
    id: "task-backup",
    relatedItemId: backupItem.id,
    title: "Backup task",
    tripPlanId: null,
  };

  return {
    backupItemId: backupItem.id,
    mainItemId: mainItem.id,
    records: {
      stopNotes: [backupNote],
      tasks: [mainTask, backupTask],
    },
    trip: {
      ...tripFixture.trip,
      bookingDocs: [backupBooking],
      expenses: [mainExpense, backupExpense, unlinkedMainExpense],
      itineraryItems: [...tripFixture.trip.itineraryItems, backupItem],
    },
  };
}

describe("trip plan records", () => {
  it("resolves record trip plan ids from linked itinerary items before fallback", () => {
    const { backupItemId, mainItemId, trip } = tripWithRecordFixtures();

    expect(tripPlanIdForRecord(trip, backupItemId, "fallback-plan")).toBe(
      "plan-backup",
    );
    expect(tripPlanIdForRecord(trip, mainItemId, "fallback-plan")).toBe(
      trip.activePlanVariantId,
    );
    expect(tripPlanIdForRecord(trip, null, "fallback-plan")).toBe(
      "fallback-plan",
    );
    expect(
      tripPlanIdForBookingRecord(
        trip,
        { relatedItineraryItemIds: [backupItemId] },
        "fallback-plan",
      ),
    ).toBe("plan-backup");
  });

  it("selects records for the active Trip Plan using explicit and linked plan ids", () => {
    const { records, trip } = tripWithRecordFixtures();

    const mainRecords = selectTripPlanRecords(
      trip,
      trip.activePlanVariantId,
      records,
    );
    expect(mainRecords.expenses.map((expense) => expense.id)).toEqual([
      "expense-main",
      "expense-unlinked-main",
    ]);
    expect(mainRecords.tasks.map((task) => task.id)).toEqual([
      "task-main-explicit",
    ]);
    expect(mainRecords.bookingDocs).toHaveLength(0);
    expect(mainRecords.stopNotes).toHaveLength(0);

    const backupRecords = selectTripPlanRecords(trip, "plan-backup", records);
    expect(backupRecords.expenses.map((expense) => expense.id)).toEqual([
      "expense-backup",
    ]);
    expect(backupRecords.bookingDocs.map((booking) => booking.id)).toEqual([
      "booking-backup",
    ]);
    expect(backupRecords.stopNotes.map((note) => note.id)).toEqual([
      "note-backup",
    ]);
    expect(backupRecords.tasks.map((task) => task.id)).toEqual([
      "task-backup",
    ]);
  });
});
