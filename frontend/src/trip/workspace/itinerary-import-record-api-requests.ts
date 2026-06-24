import type {
  CreateBookingDocApiRequest,
  CreateExpenseApiRequest,
  CreateStopNoteApiRequest,
  CreateTaskApiRequest,
  PatchTaskApiRequest,
} from "@/src/trip/api-client";
import { expenseSplitsToMinor } from "@/src/trip/expenses";
import type {
  BookingDoc,
  Expense,
  StopNote,
  TripTask,
} from "@/src/trip/types";

interface BuildImportedTaskCreateRequestInput {
  clientMutationId: string;
  task: TripTask;
}

interface BuildImportedTaskStatusPatchRequestInput {
  clientMutationId: string;
  createdTask: TripTask;
  status: TripTask["status"];
}

interface BuildImportedStopNoteCreateRequestInput {
  clientMutationId: string;
  note: StopNote;
}

interface BuildImportedExpenseCreateRequestInput {
  clientMutationId: string;
  expense: Expense;
}

interface BuildImportedBookingDocCreateRequestInput {
  bookingDoc: BookingDoc;
  clientMutationId: string;
  expenseIdMap: Map<string, string>;
  noteIdMap: Map<string, string>;
  taskIdMap: Map<string, string>;
}

export function buildImportedTaskCreateRequest({
  clientMutationId,
  task,
}: BuildImportedTaskCreateRequestInput): CreateTaskApiRequest {
  return {
    clientMutationId,
    tripPlanId: task.tripPlanId,
    title: task.title,
    visibility: task.visibility,
    kind: task.kind,
    assigneeId: task.assigneeId,
    relatedItemId: task.relatedItemId,
  };
}

export function buildImportedTaskStatusPatchRequest({
  clientMutationId,
  createdTask,
  status,
}: BuildImportedTaskStatusPatchRequestInput): PatchTaskApiRequest {
  return {
    clientMutationId,
    expectedVersion: createdTask.version ?? 1,
    patch: { status },
  };
}

export function buildImportedStopNoteCreateRequest({
  clientMutationId,
  note,
}: BuildImportedStopNoteCreateRequestInput): CreateStopNoteApiRequest {
  return {
    clientMutationId,
    tripPlanId: note.tripPlanId,
    itineraryItemId: note.itemId,
    body: note.body,
  };
}

export function buildImportedExpenseCreateRequest({
  clientMutationId,
  expense,
}: BuildImportedExpenseCreateRequestInput): CreateExpenseApiRequest {
  return {
    clientMutationId,
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
  };
}

export function buildImportedBookingDocCreateRequest({
  bookingDoc,
  clientMutationId,
  expenseIdMap,
  noteIdMap,
  taskIdMap,
}: BuildImportedBookingDocCreateRequestInput): CreateBookingDocApiRequest {
  return {
    clientMutationId,
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
    noteIds: bookingDoc.noteIds.map((noteId) => noteIdMap.get(noteId) ?? noteId),
    notes: bookingDoc.notes,
  };
}
