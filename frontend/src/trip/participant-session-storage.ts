import {
  clearBrowserSessionStorageValue,
  loadBrowserSessionJson,
  persistBrowserSessionJson,
} from "@/src/shared/storage/browser-session-json";
import {
  findSessionMember,
  tripParticipantSessionStorageKey,
} from "./auth";
import type { Trip, TripParticipantSession } from "./types";

export function persistParticipantSession(session: TripParticipantSession) {
  persistBrowserSessionJson(tripParticipantSessionStorageKey, session);
}

export function loadPersistedParticipantSession(
  requireJoin: boolean,
  trip: Trip,
  isApiMode = false,
  routeTripId?: string,
): TripParticipantSession | null {
  if (!requireJoin) return null;

  const parsedSession = loadBrowserSessionJson<TripParticipantSession>(
    tripParticipantSessionStorageKey,
    (session) => !routeTripId || session.tripId === routeTripId,
  );
  if (!parsedSession) return null;

  return isApiMode || findSessionMember(trip, parsedSession)
    ? parsedSession
    : null;
}

export function clearParticipantSession() {
  clearBrowserSessionStorageValue(tripParticipantSessionStorageKey);
}

export function isLocalParticipantSession(
  session: TripParticipantSession | null,
): boolean {
  return session?.sessionToken.startsWith("local-") ?? false;
}
