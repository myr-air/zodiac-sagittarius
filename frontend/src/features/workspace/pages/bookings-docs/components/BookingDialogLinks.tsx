import { CheckboxGroup } from "@/src/shared/components/checkbox-group";
import type { Trip, TripTask } from "@/src/trip/types";
import {
  buildExpenseOptions,
  buildItineraryItemOptions,
  buildMemberOptions,
  buildStopNoteOptions,
  buildTaskOptions,
} from "@/src/features/workspace/model/related-checkbox-options";
import type { BookingCopy } from "../content/BookingsDocsPage.copy";
import type { BookingDialogState } from "../hooks/useBookingDialogState";

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
        options={buildMemberOptions(trip.members)}
        selectedIds={state.travelerIds}
        onToggle={state.toggleTraveler}
      />
      <CheckboxGroup
        label={copy.linkedItinerary}
        options={buildItineraryItemOptions(trip.itineraryItems)}
        selectedIds={state.relatedItineraryItemIds}
        onToggle={state.toggleItineraryItem}
      />
      <CheckboxGroup
        label={copy.linkedTodos}
        options={buildTaskOptions(tasks)}
        selectedIds={state.relatedTaskIds}
        onToggle={state.toggleTask}
      />
      <CheckboxGroup
        label={copy.linkedExpenses}
        options={buildExpenseOptions(trip.expenses)}
        selectedIds={state.relatedExpenseIds}
        onToggle={state.toggleExpense}
      />
      <CheckboxGroup
        label={copy.linkedNotes}
        options={buildStopNoteOptions(stopNotes)}
        selectedIds={state.noteIds}
        onToggle={state.toggleNote}
      />
    </div>
  );
}
