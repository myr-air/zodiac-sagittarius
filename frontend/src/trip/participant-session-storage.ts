import {
  findSessionMember,
  tripParticipantSessionStorageKey,
} from "./auth";
import type { Trip, TripParticipantSession } from "./types";

function getBrowserLocalStorage(): Storage | null {
  if (
    typeof window === "undefined" ||
    !("localStorage" in window) ||
    !window.localStorage
  )
    return null;
  return window.localStorage;
}

function getBrowserSessionStorage(): Storage | null {
  if (
    typeof window === "undefined" ||
    !("sessionStorage" in window) ||
    !window.sessionStorage
  )
    return null;
  return window.sessionStorage;
}

export function persistParticipantSession(session: TripParticipantSession) {
  getBrowserSessionStorage()?.setItem(
    tripParticipantSessionStorageKey,
    JSON.stringify(session),
  );
  getBrowserLocalStorage()?.removeItem(tripParticipantSessionStorageKey);
}

export function loadPersistedParticipantSession(
  requireJoin: boolean,
  trip: Trip,
  isApiMode = false,
  routeTripId?: string,
): TripParticipantSession | null {
  const storage = getBrowserSessionStorage();
  if (!requireJoin || !storage) return null;
  const legacyLocalStorage = getBrowserLocalStorage();
  const rawSession =
    storage.getItem(tripParticipantSessionStorageKey) ??
    legacyLocalStorage?.getItem(tripParticipantSessionStorageKey);
  if (!rawSession) return null;
  try {
    const parsedSession = JSON.parse(rawSession) as TripParticipantSession;
    if (routeTripId && parsedSession.tripId !== routeTripId) {
      storage.removeItem(tripParticipantSessionStorageKey);
      legacyLocalStorage?.removeItem(tripParticipantSessionStorageKey);
      return null;
    }
    if (
      legacyLocalStorage?.getItem(tripParticipantSessionStorageKey) ===
      rawSession
    ) {
      storage.setItem(tripParticipantSessionStorageKey, rawSession);
      legacyLocalStorage.removeItem(tripParticipantSessionStorageKey);
    }
    return isApiMode || findSessionMember(trip, parsedSession)
      ? parsedSession
      : null;
  } catch {
    storage.removeItem(tripParticipantSessionStorageKey);
    legacyLocalStorage?.removeItem(tripParticipantSessionStorageKey);
    return null;
  }
}

export function clearParticipantSession() {
  getBrowserSessionStorage()?.removeItem(tripParticipantSessionStorageKey);
  getBrowserLocalStorage()?.removeItem(tripParticipantSessionStorageKey);
}

export function isLocalParticipantSession(
  session: TripParticipantSession | null,
): boolean {
  return session?.sessionToken.startsWith("local-") ?? false;
}
