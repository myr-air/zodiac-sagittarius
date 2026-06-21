import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  loadPersistedParticipantSession,
} from "@/src/trip/participant-session-storage";
import { loadPersistedTripDraft } from "@/src/trip/persistence";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import {
  resolveWorkspaceSessionRestore,
  resolveWorkspaceSessionTrip,
} from "./workspace-session-restore";

type TripWorkspaceState = {
  trip: Trip;
  past: Trip[];
  future: Trip[];
};

interface UseWorkspaceParticipantSessionRestoreOptions {
  initialTrip: Trip;
  isApiMode: boolean;
  requireJoin: boolean;
  routeTripId?: string;
  setCurrentMemberId: (memberId: string) => void;
  setParticipantSession: Dispatch<SetStateAction<TripParticipantSession | null>>;
  setSelectedTripPlanId: Dispatch<SetStateAction<string>>;
  setSessionRestored: (restored: boolean) => void;
  setTripState: Dispatch<SetStateAction<TripWorkspaceState>>;
}

export function useWorkspaceParticipantSessionRestore({
  initialTrip,
  isApiMode,
  requireJoin,
  routeTripId,
  setCurrentMemberId,
  setParticipantSession,
  setSelectedTripPlanId,
  setSessionRestored,
  setTripState,
}: UseWorkspaceParticipantSessionRestoreOptions) {
  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) setSessionRestored(false);
    });
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      const persistedTrip = loadPersistedTripDraft();
      const nextTrip = resolveWorkspaceSessionTrip(initialTrip, persistedTrip);
      const persistedSession = loadPersistedParticipantSession(
        requireJoin,
        nextTrip,
        isApiMode,
        routeTripId,
      );
      const restored = resolveWorkspaceSessionRestore({
        initialTrip,
        persistedSession,
        persistedTrip,
      });

      if (restored.shouldReplaceTripState) {
        setTripState({ trip: restored.nextTrip, past: [], future: [] });
        setSelectedTripPlanId(restored.selectedTripPlanId!);
      }
      if (restored.participantSession) {
        setParticipantSession(restored.participantSession);
        setCurrentMemberId(restored.currentMemberId!);
      } else {
        setParticipantSession(null);
      }
      setSessionRestored(true);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [
    initialTrip,
    isApiMode,
    requireJoin,
    routeTripId,
    setCurrentMemberId,
    setParticipantSession,
    setSelectedTripPlanId,
    setSessionRestored,
    setTripState,
  ]);
}
