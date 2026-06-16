import type { TripApiClient } from "@/src/trip/api-client";
import { expenseSplitsToMinor } from "@/src/trip/expenses";
import type {
  BookingDoc,
  Expense,
  StopNote,
  TripTask,
} from "@/src/trip/types";
import type { ImportedPlanRecords } from "./itinerary-import-model";

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
    let createdTask = await apiClient.createTask(tripId, sessionToken, {
      clientMutationId: nextClientMutationId("itinerary-import-task-create"),
      tripPlanId: task.tripPlanId,
      title: task.title,
      visibility: task.visibility,
      kind: task.kind,
      assigneeId: task.assigneeId,
      relatedItemId: task.relatedItemId,
    });
    if (task.status !== createdTask.status) {
      createdTask = await apiClient.patchTask(
        tripId,
        createdTask.id,
        sessionToken,
        {
          clientMutationId: nextClientMutationId(
            "itinerary-import-task-status",
          ),
          expectedVersion: createdTask.version ?? 1,
          patch: { status: task.status },
        },
      );
    }
    taskIdMap.set(task.id, createdTask.id);
    createdTasks.push(createdTask);
  }

  for (const expense of records.expenses) {
    const createdExpense = await apiClient.createExpense(tripId, sessionToken, {
      clientMutationId: nextClientMutationId("itinerary-import-expense-create"),
      tripPlanId: expense.tripPlanId,
      title: expense.title,
      amountMinor:
        expense.amountMinor ?? Math.round((expense.amount ?? 0) * 100),
      currency: expense.currency ?? "HKD",
      exchangeRateToSettlementCurrency:
        expense.exchangeRateToSettlementCurrency ?? 1,
      notes: expense.notes ?? null,
      receiptUrl: expense.receiptUrl ?? null,
      lineItems: expense.lineItems ?? [],
      comments: expense.comments ?? [],
      paidBy: expense.paidBy,
      category: expense.category,
      splits: expenseSplitsToMinor(expense.splits),
      itineraryItemId: expense.itineraryItemId ?? null,
    });
    expenseIdMap.set(expense.id, createdExpense.id);
    createdExpenses.push(createdExpense);
  }

  for (const note of records.stopNotes) {
    const createdNote = await apiClient.createStopNote(tripId, sessionToken, {
      clientMutationId: nextClientMutationId("itinerary-import-note-create"),
      tripPlanId: note.tripPlanId,
      itineraryItemId: note.itemId,
      body: note.body,
    });
    noteIdMap.set(note.id, createdNote.id);
    createdStopNotes.push(createdNote);
  }

  for (const bookingDoc of records.bookingDocs) {
    const createdBookingDoc = await apiClient.createBookingDoc(
      tripId,
      sessionToken,
      {
        clientMutationId: nextClientMutationId(
          "itinerary-import-booking-create",
        ),
        tripPlanId: bookingDoc.tripPlanId,
        type: bookingDoc.type,
        title: bookingDoc.title,
        status: bookingDoc.status,
        visibility: bookingDoc.visibility,
        ownerMemberId: bookingDoc.ownerMemberId,
        providerName: bookingDoc.providerName,
        confirmationCode: bookingDoc.confirmationCode,
        startsAt: bookingDoc.startsAt,
        endsAt: bookingDoc.endsAt,
        timezone: bookingDoc.timezone,
        priceAmount: bookingDoc.priceAmount,
        currency: bookingDoc.currency,
        travelerIds: bookingDoc.travelerIds,
        externalLinks: bookingDoc.externalLinks,
        relatedItineraryItemIds: bookingDoc.relatedItineraryItemIds,
        relatedTaskIds: bookingDoc.relatedTaskIds.map(
          (taskId) => taskIdMap.get(taskId) ?? taskId,
        ),
        relatedExpenseIds: bookingDoc.relatedExpenseIds.map(
          (expenseId) => expenseIdMap.get(expenseId) ?? expenseId,
        ),
        noteIds: bookingDoc.noteIds.map(
          (noteId) => noteIdMap.get(noteId) ?? noteId,
        ),
        notes: bookingDoc.notes,
      },
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
