import type { Trip } from "@/src/trip/types";

export const selectedTripPlanQueryParam = "tripPlanId";
const selectedTripPlanSessionStoragePrefix = "sagittarius:selected-trip-plan:";

export function initialSelectedTripPlanId(trip: Trip): string {
  return (
    trip.mainTripPlanId ||
    trip.activePlanVariantId ||
    trip.tripPlans?.[0]?.id ||
    trip.planVariants[0]?.id ||
    ""
  );
}

export function resolveSelectedTripPlanId(
  trip: Trip,
  preferredTripPlanId?: string | null,
): string {
  if (preferredTripPlanId && tripHasPlan(trip, preferredTripPlanId)) {
    return preferredTripPlanId;
  }
  return browserSelectedTripPlanId(trip) ?? initialSelectedTripPlanId(trip);
}

export function rememberSelectedTripPlanId(trip: Trip, tripPlanId: string) {
  if (!tripPlanId || typeof window === "undefined") return;
  safeSessionStorage()?.setItem(selectedTripPlanStorageKey(trip.id), tripPlanId);

  const searchParams = new URLSearchParams(window.location.search);
  const defaultTripPlanId = initialSelectedTripPlanId(trip);
  if (tripPlanId === defaultTripPlanId) {
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

export function tripHasPlan(trip: Trip, tripPlanId: string): boolean {
  return [...trip.planVariants, ...(trip.tripPlans ?? [])].some(
    (plan) => plan.id === tripPlanId,
  );
}

export function selectedTripPlanStorageKey(tripId: string): string {
  return `${selectedTripPlanSessionStoragePrefix}${tripId}`;
}

function browserSelectedTripPlanId(trip: Trip): string | null {
  if (typeof window === "undefined") return null;
  const searchParams = new URLSearchParams(window.location.search);
  const urlTripPlanId = searchParams.get(selectedTripPlanQueryParam);
  if (urlTripPlanId && tripHasPlan(trip, urlTripPlanId)) return urlTripPlanId;

  const storedTripPlanId = safeSessionStorage()?.getItem(
    selectedTripPlanStorageKey(trip.id),
  );
  if (storedTripPlanId && tripHasPlan(trip, storedTripPlanId)) {
    return storedTripPlanId;
  }
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
