import { useCallback, useState } from "react";
import { tripFixtureStopNotes, tripFixtureSuggestions, tripFixtureTasks } from "@/src/trip/trip-fixtures";
import type { TripCockpit } from "@/src/trip/api-client";
import type { StopNote, Suggestion, TripTask } from "@/src/trip/types";

export interface InitialTripState {
  suggestions?: Suggestion[];
  stopNotes?: StopNote[];
  tasks?: TripTask[];
}

export function useWorkspaceRecordState(initialTrip: InitialTripState) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() =>
    (initialTrip.suggestions ?? tripFixtureSuggestions).map((suggestion) => ({
      ...suggestion,
    })),
  );
  const [tasks, setTasks] = useState<TripTask[]>(() =>
    (initialTrip.tasks ?? tripFixtureTasks).map((task) => ({ ...task })),
  );
  const [stopNotes, setStopNotes] = useState<StopNote[]>(() =>
    (initialTrip.stopNotes ?? tripFixtureStopNotes).map((note) => ({
      ...note,
    })),
  );

  const replaceWorkspaceRecords = useCallback((cockpit: TripCockpit) => {
    setSuggestions(cockpit.suggestions.map((suggestion) => ({
      ...suggestion,
    })));
    setTasks(cockpit.tasks.map((task) => ({ ...task })));
    setStopNotes(cockpit.stopNotes.map((note) => ({ ...note })));
  }, []);

  return {
    replaceWorkspaceRecords,
    setStopNotes,
    setSuggestions,
    setTasks,
    stopNotes,
    suggestions,
    tasks,
  };
}
