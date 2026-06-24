import type { BookingDoc, Expense, StopNote, TripTask } from "@/src/trip/types";

export const importedTask: TripTask = {
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

export function buildImportedTask(
  overrides: Partial<TripTask> & Pick<TripTask, "id">,
): TripTask {
  return {
    ...importedTask,
    ...overrides,
  };
}

export const importedExpense: Expense = {
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

export function buildImportedExpense(
  overrides: Partial<Expense> & Pick<Expense, "id">,
): Expense {
  return {
    ...importedExpense,
    ...overrides,
  };
}

export const importedStopNote: StopNote = {
  authorId: "member-aom",
  body: "Use exit C",
  createdAt: "2026-06-16T00:00:00.000Z",
  id: "note-import",
  itemId: "item-created",
  tripId: "trip-demo",
  tripPlanId: "plan-rain",
};

export function buildImportedStopNote(
  overrides: Partial<StopNote> & Pick<StopNote, "id">,
): StopNote {
  return {
    ...importedStopNote,
    ...overrides,
  };
}

export const importedBookingDoc: BookingDoc = {
  confirmationCode: "ABC123",
  createdBy: "member-aom",
  currency: "HKD",
  endsAt: null,
  externalLinks: [],
  id: "booking-import",
  noteIds: [importedStopNote.id],
  notes: "Bring passports",
  ownerMemberId: "member-aom",
  priceAmount: 12,
  providerName: "Museum",
  relatedExpenseIds: [importedExpense.id],
  relatedItineraryItemIds: ["item-created"],
  relatedTaskIds: [importedTask.id],
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

export function buildImportedBookingDoc(
  overrides: Partial<BookingDoc> & Pick<BookingDoc, "id">,
): BookingDoc {
  return {
    ...importedBookingDoc,
    ...overrides,
  };
}
