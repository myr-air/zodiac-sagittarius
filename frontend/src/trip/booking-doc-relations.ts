import type {
  BookingDoc,
  Expense,
  ItineraryItem,
  Member,
  StopNote,
  Trip,
  TripTask,
} from "./types";

export interface BookingDocRelations {
  itineraryItems: ItineraryItem[];
  tasks: TripTask[];
  expenses: Expense[];
  notes: StopNote[];
  travelers: Member[];
}

export function findBookingDocRelations(
  doc: BookingDoc,
  trip: Trip,
  tasks: TripTask[],
): BookingDocRelations {
  const itineraryItemIds = new Set(doc.relatedItineraryItemIds);
  const taskIds = new Set(doc.relatedTaskIds);
  const expenseIds = new Set(doc.relatedExpenseIds);
  const noteIds = new Set(doc.noteIds);
  const travelerIds = new Set(doc.travelerIds);

  return {
    itineraryItems: trip.itineraryItems.filter((item) =>
      itineraryItemIds.has(item.id),
    ),
    tasks: tasks.filter((task) => taskIds.has(task.id)),
    expenses: trip.expenses.filter((expense) => expenseIds.has(expense.id)),
    notes: (trip.stopNotes ?? []).filter(
      (note) => noteIds.has(note.id) || itineraryItemIds.has(note.itemId),
    ),
    travelers: trip.members.filter((member) => travelerIds.has(member.id)),
  };
}
