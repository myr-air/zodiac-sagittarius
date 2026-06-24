import { useEffect, useMemo, useState } from "react";
import type {
  BookingDoc,
  Expense,
  ItineraryAdvisory,
  ItineraryItem,
  StopNote,
  Suggestion,
  Trip,
  TripTask,
} from "@/src/trip/types";
import type { ContextRailTab } from "./context-rail.utils";

interface ContextRailSelectionInput {
  trip: Pick<Trip, "expenses">;
  selectedItem?: ItineraryItem;
  stopNotes: StopNote[];
  tasks: TripTask[];
  bookingDocs: BookingDoc[];
  suggestions: Suggestion[];
}

export interface ContextRailSelection {
  selectedAdvisories: ItineraryAdvisory[];
  selectedNotes: StopNote[];
  selectedExpenses: Expense[];
  selectedTasks: TripTask[];
  selectedBookingDocs: BookingDoc[];
  selectedSuggestions: Suggestion[];
}

export function buildContextRailSelection({
  trip,
  selectedItem,
  stopNotes,
  tasks,
  bookingDocs,
  suggestions,
}: ContextRailSelectionInput): ContextRailSelection {
  if (!selectedItem) {
    return {
      selectedAdvisories: [],
      selectedNotes: [],
      selectedExpenses: trip.expenses,
      selectedTasks: [],
      selectedBookingDocs: [],
      selectedSuggestions: [],
    };
  }

  const selectedActivity = selectedItem.activity.toLowerCase();

  return {
    selectedAdvisories: selectedItem.advisories ?? [],
    selectedNotes: stopNotes.filter((note) => note.itemId === selectedItem.id),
    selectedExpenses: trip.expenses.filter(
      (expense) => expense.itineraryItemId === selectedItem.id,
    ),
    selectedTasks: tasks.filter(
      (task) =>
        task.relatedItemId === selectedItem.id ||
        (task.kind === "booking" &&
          task.title.toLowerCase().includes(selectedActivity)),
    ),
    selectedBookingDocs: bookingDocs.filter((bookingDoc) =>
      bookingDoc.relatedItineraryItemIds.includes(selectedItem.id),
    ),
    selectedSuggestions: suggestions.filter(
      (suggestion) =>
        suggestion.targetItemId === selectedItem.id &&
        (suggestion.status === "pending" || suggestion.status === "conflicted"),
    ),
  };
}

interface ContextRailStateInput extends ContextRailSelectionInput {
  open: boolean;
  preferredTab: ContextRailTab;
}

export function useContextRailState({
  trip,
  selectedItem,
  stopNotes,
  tasks,
  bookingDocs,
  suggestions,
  open,
  preferredTab,
}: ContextRailStateInput) {
  const [activeTab, setActiveTab] = useState<ContextRailTab>(preferredTab);
  const selection = useMemo(
    () =>
      buildContextRailSelection({
        trip,
        selectedItem,
        stopNotes,
        tasks,
        bookingDocs,
        suggestions,
      }),
    [bookingDocs, selectedItem, stopNotes, suggestions, tasks, trip],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setActiveTab(preferredTab);
    });
    return () => {
      cancelled = true;
    };
  }, [open, preferredTab, selectedItem?.id]);

  return {
    activeTab,
    setActiveTab,
    ...selection,
  };
}
