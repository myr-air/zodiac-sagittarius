import { useCallback, useRef, useState } from "react";
import { persistTripDraft } from "@/src/trip/persistence";
import { normalizeTripPlanAliases } from "@/src/trip/trip-plans";
import type { Trip } from "@/src/trip/types";

export interface TripWorkspaceState {
  trip: Trip;
  past: Trip[];
  future: Trip[];
}

export function useTripWorkspaceState(
  initialTrip: Trip,
  onSelectItem?: (itemId: string) => void,
) {
  const [tripState, setTripState] = useState<TripWorkspaceState>(() => ({
    trip: normalizeTripPlanAliases(initialTrip),
    past: [],
    future: [],
  }));
  const latestTripRef = useRef(tripState.trip);
  const trip = tripState.trip;

  const commitTrip = useCallback(
    (
      updater: (current: Trip) => Trip,
      nextSelectedItemId?: string,
    ) => {
      setTripState((current) => {
        const nextTrip = normalizeTripPlanAliases(updater(current.trip));
        persistTripDraft(nextTrip, normalizeTripPlanAliases);
        return {
          trip: nextTrip,
          past: [...current.past, current.trip].slice(-20),
          future: [],
        };
      });
      if (nextSelectedItemId) onSelectItem?.(nextSelectedItemId);
    },
    [onSelectItem],
  );

  const replaceApiTrip = useCallback((nextTrip: Trip) => {
    latestTripRef.current = nextTrip;
    setTripState((current) => ({ ...current, trip: nextTrip }));
  }, []);

  const resetTrip = useCallback(
    (nextTrip: Trip, options?: { persist?: boolean }) => {
      const normalizedTrip = normalizeTripPlanAliases(nextTrip);
      if (options?.persist) {
        persistTripDraft(normalizedTrip, normalizeTripPlanAliases);
      }
      latestTripRef.current = normalizedTrip;
      setTripState({ trip: normalizedTrip, past: [], future: [] });
    },
    [],
  );

  const updateApiTrip = useCallback((updater: (current: Trip) => Trip) => {
    setTripState((current) => {
      const nextTrip = updater(current.trip);
      latestTripRef.current = nextTrip;
      return { ...current, trip: nextTrip };
    });
  }, []);

  const undo = useCallback(() => {
    setTripState((current) => {
      const previous = current.past.at(-1);
      /* v8 ignore next */
      if (!previous) return current;
      return {
        trip: previous,
        past: current.past.slice(0, -1),
        future: [current.trip, ...current.future].slice(0, 20),
      };
    });
  }, []);

  const redo = useCallback(() => {
    setTripState((current) => {
      const next = current.future[0];
      /* v8 ignore next */
      if (!next) return current;
      return {
        trip: next,
        past: [...current.past, current.trip].slice(-20),
        future: current.future.slice(1),
      };
    });
  }, []);

  return {
    canRedo: tripState.future.length > 0,
    canUndo: tripState.past.length > 0,
    commitTrip,
    latestTripRef,
    redo,
    replaceApiTrip,
    resetTrip,
    setTripState,
    trip,
    undo,
    updateApiTrip,
  };
}
