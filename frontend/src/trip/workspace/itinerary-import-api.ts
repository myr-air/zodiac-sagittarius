import type {
  CreateBookingDocApiRequest,
  CreateExpenseApiRequest,
  CreateItineraryItemApiRequest,
  CreateStopNoteApiRequest,
  CreateTaskApiRequest,
  ImportItineraryApiRequest,
  PatchTaskApiRequest,
  TripApiClient,
} from "@/src/trip/api-client";
import { expenseSplitsToMinor } from "@/src/trip/expenses";
import type {
  BookingDoc,
  Expense,
  ItineraryItem,
  StopNote,
  TripTask,
} from "@/src/trip/types";
import {
  resolveCreatedImportId,
  type ImportedPlanRecords,
} from "./itinerary-import-model";

interface CreateImportedPlanRecordsViaApiInput {
  apiClient: TripApiClient;
  nextClientMutationId: (prefix: string) => string;
  records: ImportedPlanRecords;
  sessionToken: string;
  tripId: string;
}

interface BuildImportedItineraryItemCreateRequestInput {
  clientMutationId: string;
  createdItemIdsByImportId: Map<string, string>;
  createdItemIdsByPreviewId: Map<string, string>;
  item: ItineraryItem;
}

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

export interface BuildImportItineraryRequestInput {
  content: string;
  contentType?: string;
  fileName?: string;
}

export function buildImportItineraryRequest({
  content,
  contentType,
  fileName,
}: BuildImportItineraryRequestInput): ImportItineraryApiRequest {
  return {
    fileName,
    contentType,
    mode: "auto",
    content,
  };
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

export function buildImportedItineraryItemCreateRequest({
  clientMutationId,
  createdItemIdsByImportId,
  createdItemIdsByPreviewId,
  item,
}: BuildImportedItineraryItemCreateRequestInput): CreateItineraryItemApiRequest {
  return {
    clientMutationId,
    planVariantId: item.planVariantId,
    pathGroupId: item.pathGroupId,
    pathId: item.pathId,
    pathName: item.pathName,
    pathRole: item.pathRole,
    parentItemId: resolveCreatedImportId(item.parentItemId, [
      createdItemIdsByImportId,
      createdItemIdsByPreviewId,
    ]),
    itemKind: item.itemKind,
    timeMode: item.timeMode,
    isPlanBlock: item.isPlanBlock,
    status: item.status,
    priority: item.priority,
    day: item.day,
    startTime: item.startTime,
    endTime: item.endTime,
    endOffsetDays: item.endOffsetDays,
    activity: item.activity,
    activityType: item.activityType,
    activitySubtype: item.activitySubtype ?? null,
    place: item.place,
    mapLink: item.mapLink,
    address: item.address,
    coordinates: item.coordinates,
    durationMinutes: item.durationMinutes,
    transportation: item.transportation,
    details: item.details,
    note: item.note,
  };
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
