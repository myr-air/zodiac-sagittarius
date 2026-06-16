import { describe, expect, it, vi } from "vitest";
import type { TripApiClient } from "@/src/trip/api-client";
import type {
  BookingDoc,
  Expense,
  StopNote,
  TripTask,
} from "@/src/trip/types";
import { createImportedPlanRecordsViaApi } from "./itinerary-import-api";
import type { ImportedPlanRecords } from "./itinerary-import-model";

const task: TripTask = {
  assigneeId: "member-aom",
  createdBy: "member-aom",
  id: "task-import",
  kind: "booking",
  relatedItemId: "item-created",
  status: "done",
  title: "Confirm tickets",
  tripPlanId: "plan-rain",
  visibility: "shared",
};

const expense: Expense = {
  amount: 12,
  category: "tickets",
  currency: "HKD",
  id: "expense-import",
  itineraryItemId: "item-created",
  paidBy: "member-aom",
  splits: { "member-aom": 12 },
  title: "Museum ticket",
  tripPlanId: "plan-rain",
};

const note: StopNote = {
  authorId: "member-aom",
  body: "Use exit C",
  createdAt: "2026-06-16T00:00:00.000Z",
  id: "note-import",
  itemId: "item-created",
  tripId: "trip-demo",
  tripPlanId: "plan-rain",
};

const bookingDoc: BookingDoc = {
  confirmationCode: "ABC123",
  createdBy: "member-aom",
  currency: "HKD",
  endsAt: null,
  externalLinks: [],
  id: "booking-import",
  noteIds: [note.id],
  notes: "Bring passports",
  ownerMemberId: "member-aom",
  priceAmount: 12,
  providerName: "Museum",
  relatedExpenseIds: [expense.id],
  relatedItineraryItemIds: ["item-created"],
  relatedTaskIds: [task.id],
  startsAt: null,
  status: "confirmed",
  timezone: "Asia/Hong_Kong",
  title: "Museum booking",
  travelerIds: ["member-aom"],
  tripId: "trip-demo",
  tripPlanId: "plan-rain",
  type: "activity_ticket",
  updatedAt: "2026-06-16T00:00:00.000Z",
  version: 1,
  visibility: "shared",
};

describe("itinerary import API adapter", () => {
  it("creates imported records and remaps linked booking relations", async () => {
    const createdTask: TripTask = {
      ...task,
      id: "task-created",
      status: "open",
      version: 1,
    };
    const patchedTask: TripTask = {
      ...createdTask,
      status: "done",
      version: 2,
    };
    const createdExpense: Expense = { ...expense, id: "expense-created" };
    const createdNote: StopNote = { ...note, id: "note-created" };
    const createdBookingDoc: BookingDoc = {
      ...bookingDoc,
      id: "booking-created",
      relatedExpenseIds: [createdExpense.id],
      relatedTaskIds: [patchedTask.id],
      noteIds: [createdNote.id],
    };
    const apiClient = {
      createTask: vi.fn(async () => createdTask),
      patchTask: vi.fn(async () => patchedTask),
      createExpense: vi.fn(async () => createdExpense),
      createStopNote: vi.fn(async () => createdNote),
      createBookingDoc: vi.fn(async () => createdBookingDoc),
    } as unknown as TripApiClient;
    const nextClientMutationId = vi.fn(
      (prefix: string) => `${prefix}-mutation`,
    );
    const records: ImportedPlanRecords = {
      bookingDocs: [bookingDoc],
      expenses: [expense],
      stopNotes: [note],
      tasks: [task],
    };

    const createdRecords = await createImportedPlanRecordsViaApi({
      apiClient,
      nextClientMutationId,
      records,
      sessionToken: "session-token",
      tripId: "trip-demo",
    });

    expect(apiClient.createTask).toHaveBeenCalledWith(
      "trip-demo",
      "session-token",
      expect.objectContaining({
        clientMutationId: "itinerary-import-task-create-mutation",
        title: task.title,
      }),
    );
    expect(apiClient.patchTask).toHaveBeenCalledWith(
      "trip-demo",
      createdTask.id,
      "session-token",
      expect.objectContaining({
        clientMutationId: "itinerary-import-task-status-mutation",
        expectedVersion: 1,
        patch: { status: "done" },
      }),
    );
    expect(apiClient.createExpense).toHaveBeenCalledWith(
      "trip-demo",
      "session-token",
      expect.objectContaining({
        amountMinor: 1200,
        clientMutationId: "itinerary-import-expense-create-mutation",
        splits: { "member-aom": 1200 },
      }),
    );
    expect(apiClient.createBookingDoc).toHaveBeenCalledWith(
      "trip-demo",
      "session-token",
      expect.objectContaining({
        noteIds: [createdNote.id],
        relatedExpenseIds: [createdExpense.id],
        relatedTaskIds: [patchedTask.id],
      }),
    );
    expect(createdRecords).toEqual({
      bookingDocs: [createdBookingDoc],
      expenses: [createdExpense],
      stopNotes: [createdNote],
      tasks: [patchedTask],
    });
  });
});
