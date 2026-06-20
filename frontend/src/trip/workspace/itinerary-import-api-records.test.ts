import { describe, expect, it, vi } from "vitest";
import type { TripApiClient } from "@/src/trip/api-client";
import type { BookingDoc, Expense, StopNote, TripTask } from "@/src/trip/types";
import { createImportedPlanRecordsViaApi } from "./itinerary-import-api-records";
import {
  importedBookingDoc,
  importedExpense,
  importedStopNote,
  importedTask,
} from "./itinerary-import-api.test-support";
import type { ImportedPlanRecords } from "./itinerary-import-model";

describe("itinerary import API record creation", () => {
  it("creates imported records and remaps linked booking relations", async () => {
    const createdTask: TripTask = {
      ...importedTask,
      id: "task-created",
      status: "open",
      version: 1,
    };
    const patchedTask: TripTask = {
      ...createdTask,
      status: "done",
      version: 2,
    };
    const createdExpense: Expense = {
      ...importedExpense,
      id: "expense-created",
    };
    const createdNote: StopNote = { ...importedStopNote, id: "note-created" };
    const createdBookingDoc: BookingDoc = {
      ...importedBookingDoc,
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
      bookingDocs: [importedBookingDoc],
      expenses: [importedExpense],
      stopNotes: [importedStopNote],
      tasks: [importedTask],
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
        title: importedTask.title,
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
