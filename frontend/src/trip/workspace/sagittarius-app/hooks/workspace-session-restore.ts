import { normalizeTripPlanAliases } from "@/src/trip/trip-plans";
import { resolveSelectedTripPlanId } from "@/src/trip/workspace/selected-trip-plan";
import type { Trip, TripParticipantSession } from "@/src/trip/types";

interface ResolveWorkspaceSessionRestoreOptions {
  initialTrip: Trip;
  persistedSession: TripParticipantSession | null;
  persistedTrip: Trip | null;
}

interface WorkspaceSessionRestore {
  currentMemberId: string | null;
  nextTrip: Trip;
  participantSession: TripParticipantSession | null;
  selectedTripPlanId: string | null;
  shouldReplaceTripState: boolean;
}

export function resolveWorkspaceSessionTrip(
  initialTrip: Trip,
  persistedTrip: Trip | null,
): Trip {
  return normalizeTripPlanAliases(persistedTrip ?? initialTrip);
}

export function resolveWorkspaceSessionRestore({
  initialTrip,
  persistedSession,
  persistedTrip,
}: ResolveWorkspaceSessionRestoreOptions): WorkspaceSessionRestore {
  const shouldReplaceTripState = Boolean(persistedTrip);
  const nextTrip = resolveWorkspaceSessionTrip(initialTrip, persistedTrip);

  return {
    currentMemberId: persistedSession?.memberId ?? null,
    nextTrip,
    participantSession: persistedSession,
    selectedTripPlanId: shouldReplaceTripState
      ? resolveSelectedTripPlanId(nextTrip)
      : null,
    shouldReplaceTripState,
  };
}
