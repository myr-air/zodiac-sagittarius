import {
  defaultTripPlanId,
  tripHasPlan,
} from "@/src/trip/trip-plans";
import type { Trip } from "@/src/trip/types";

export const selectedTripPlanQueryParam = "tripPlanId";
const selectedTripPlanSessionStoragePrefix = "sagittarius:selected-trip-plan:";

export function initialSelectedTripPlanId(trip: Trip): string {
  return defaultTripPlanId(trip);
}

export function resolveSelectedTripPlanId(
  trip: Trip,
  preferredTripPlanId?: string | null,
): string {
  if (preferredTripPlanId && tripHasPlan(trip, preferredTripPlanId)) {
    return preferredTripPlanId;
  }
  return urlSelectedTripPlanId(trip) ?? initialSelectedTripPlanId(trip);
}

export function rememberSelectedTripPlanId(trip: Trip, tripPlanId: string) {
  if (!tripPlanId || typeof window === "undefined") return;
  safeSessionStorage()?.setItem(selectedTripPlanStorageKey(trip.id), tripPlanId);

  const searchParams = new URLSearchParams(window.location.search);
  const defaultSelectedTripPlanId = initialSelectedTripPlanId(trip);
  if (tripPlanId === defaultSelectedTripPlanId) {
    searchParams.delete(selectedTripPlanQueryParam);
  } else {
    searchParams.set(selectedTripPlanQueryParam, tripPlanId);
  }
  const nextSearch = searchParams.toString();
  const nextHref = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
  if (
    nextHref !==
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  ) {
    window.history.replaceState(window.history.state, "", nextHref);
  }
}

export function selectedTripPlanStorageKey(tripId: string): string {
  return `${selectedTripPlanSessionStoragePrefix}${tripId}`;
}

function urlSelectedTripPlanId(trip: Trip): string | null {
  if (typeof window === "undefined") return null;
  const searchParams = new URLSearchParams(window.location.search);
  const urlTripPlanId = searchParams.get(selectedTripPlanQueryParam);
  if (urlTripPlanId && tripHasPlan(trip, urlTripPlanId)) return urlTripPlanId;
  return null;
}

function safeSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
