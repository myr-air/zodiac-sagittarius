import type { TripApiClient } from "@/src/trip/api-client";
import type {
  BookingDoc,
  Expense,
  StopNote,
  TripTask,
} from "@/src/trip/types";
import type { ImportedPlanRecords } from "./itinerary-import-record-mapping";
import {
  buildImportedBookingDocCreateRequest,
  buildImportedExpenseCreateRequest,
  buildImportedStopNoteCreateRequest,
  buildImportedTaskCreateRequest,
  buildImportedTaskStatusPatchRequest,
} from "./itinerary-import-api-requests";

interface CreateImportedPlanRecordsViaApiInput {
  apiClient: TripApiClient;
  nextClientMutationId: (prefix: string) => string;
  records: ImportedPlanRecords;
  sessionToken: string;
  tripId: string;
}

export async function createImportedPlanRecordsViaApi({
  apiClient,
  nextClientMutationId,
  records,
  sessionToken,
  tripId,
}: CreateImportedPlanRecordsViaApiInput): Promise<ImportedPlanRecords> {
  const taskIdMap = new Map<string, string>();
  const expenseIdMap = new Map<string, string>();
  const noteIdMap = new Map<string, string>();
  const createdTasks: TripTask[] = [];
  const createdExpenses: Expense[] = [];
  const createdStopNotes: StopNote[] = [];
  const createdBookingDocs: BookingDoc[] = [];

  for (const task of records.tasks) {
    let createdTask = await apiClient.createTask(
      tripId,
      sessionToken,
      buildImportedTaskCreateRequest({
        clientMutationId: nextClientMutationId(
          "itinerary-import-task-create",
        ),
        task,
      }),
    );
    if (task.status !== createdTask.status) {
      createdTask = await apiClient.patchTask(
        tripId,
        createdTask.id,
        sessionToken,
        buildImportedTaskStatusPatchRequest({
          clientMutationId: nextClientMutationId(
            "itinerary-import-task-status",
          ),
          createdTask,
          status: task.status,
        }),
      );
    }
    taskIdMap.set(task.id, createdTask.id);
    createdTasks.push(createdTask);
  }

  for (const expense of records.expenses) {
    const createdExpense = await apiClient.createExpense(
      tripId,
      sessionToken,
      buildImportedExpenseCreateRequest({
        clientMutationId: nextClientMutationId(
          "itinerary-import-expense-create",
        ),
        expense,
      }),
    );
    expenseIdMap.set(expense.id, createdExpense.id);
    createdExpenses.push(createdExpense);
  }

  for (const note of records.stopNotes) {
    const createdNote = await apiClient.createStopNote(
      tripId,
      sessionToken,
      buildImportedStopNoteCreateRequest({
        clientMutationId: nextClientMutationId(
          "itinerary-import-note-create",
        ),
        note,
      }),
    );
    noteIdMap.set(note.id, createdNote.id);
    createdStopNotes.push(createdNote);
  }

  for (const bookingDoc of records.bookingDocs) {
    const createdBookingDoc = await apiClient.createBookingDoc(
      tripId,
      sessionToken,
      buildImportedBookingDocCreateRequest({
        bookingDoc,
        clientMutationId: nextClientMutationId(
          "itinerary-import-booking-create",
        ),
        expenseIdMap,
        noteIdMap,
        taskIdMap,
      }),
    );
    createdBookingDocs.push(createdBookingDoc);
  }

  return {
    bookingDocs: createdBookingDocs,
    expenses: createdExpenses,
    stopNotes: createdStopNotes,
    tasks: createdTasks,
  };
}
