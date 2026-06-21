import { CheckboxGroup } from "@/src/shared/components/checkbox-group";
import type { Trip, TripTask } from "@/src/trip/types";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import type { BookingDialogState } from "./useBookingDialogState";

interface BookingDialogLinksProps {
  copy: BookingCopy;
  state: BookingDialogState;
  tasks: TripTask[];
  trip: Trip;
}

export function BookingDialogLinks({ copy, state, tasks, trip }: BookingDialogLinksProps) {
  const stopNotes = trip.stopNotes ?? [];

  return (
    <div className="grid gap-3">
      <CheckboxGroup
        label={copy.travelersField}
        options={trip.members.map((member) => ({ id: member.id, label: member.displayName }))}
        selectedIds={state.travelerIds}
        onToggle={state.toggleTraveler}
      />
      <CheckboxGroup
        label={copy.linkedItinerary}
        options={trip.itineraryItems.map((item) => ({ id: item.id, label: `${item.day} · ${item.activity}` }))}
        selectedIds={state.relatedItineraryItemIds}
        onToggle={state.toggleItineraryItem}
      />
      <CheckboxGroup
        label={copy.linkedTodos}
        options={tasks.map((task) => ({ id: task.id, label: task.title }))}
        selectedIds={state.relatedTaskIds}
        onToggle={state.toggleTask}
      />
      <CheckboxGroup
        label={copy.linkedExpenses}
        options={trip.expenses.map((expense) => ({ id: expense.id, label: expense.title }))}
        selectedIds={state.relatedExpenseIds}
        onToggle={state.toggleExpense}
      />
      <CheckboxGroup
        label={copy.linkedNotes}
        options={stopNotes.map((note) => ({ id: note.id, label: note.body }))}
        selectedIds={state.noteIds}
        onToggle={state.toggleNote}
      />
    </div>
  );
}
