import { tripParticipantSessionStorageKey } from "./auth";
import type { TripParticipantSession } from "./types";

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
