import type { PlanningView } from "@/src/app/SagittariusApp";
import { encodeTripId } from "@/src/trip/ids";

export function encodeReturnTo(path: string): string {
  try {
    const base64 = btoa(unescape(encodeURIComponent(path)));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return path;
  }
}

export function decodeReturnTo(encoded: string): string {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    return decodeURIComponent(escape(atob(base64)));
  } catch {
    return encoded;
  }
}

function segment(value: string): string {
  return encodeURIComponent(value);
}

function tripRouteSegment(value: string): string {
  return segment(encodeTripId(value));
}

export const appRoutes = {
  home: () => "/",
  about: () => "/about",
  access: (mode: "sign-in" | "register" = "sign-in") => `/access?mode=${mode}`,
  login: () => "/access?mode=sign-in",
  register: () => "/access?mode=register",
  portal: () => "/portal",
  portalMyTrips: () => "/portal/my-trips",
  portalNewTrip: () => "/portal/trips/new",
  portalExplorer: () => "/portal/explorer",
  portalToDos: () => "/portal/to-dos",
  portalVault: () => "/portal/vault",
  portalSettings: () => "/portal/settings",
  portalSignOut: () => "/portal/sign-out",
  account: () => "/account",
  trips: () => "/trips",
  newTrip: () => "/trips/new",
  join: (joinCode?: string, returnTo?: string) => {
    const base = joinCode ? `/join/${segment(joinCode)}` : "/join";
    return returnTo ? `${base}?rt=${encodeURIComponent(encodeReturnTo(returnTo))}` : base;
  },
  tripOverview: (tripId: string) => `/trips/${tripRouteSegment(tripId)}`,
  tripItinerary: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/itinerary`,
  tripMap: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/map`,
  tripTimeline: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/timeline`,
  tripBookings: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/bookings`,
  tripPhotos: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/photos`,
  tripMembers: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/members`,
  tripExpenses: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/expenses`,
  tripSettings: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/settings`,
};

interface TripWorkspaceNavItem {
  id: PlanningView;
  label: string;
  icon: "home" | "calendar" | "map" | "list" | "users" | "settings" | "wallet" | "ticket" | "cloud";
  href: string;
}

export interface TripWorkspaceNavLabels {
  overview: string;
  itinerary: string;
  map: string;
  timeline: string;
  bookings: string;
  photos: string;
  members: string;
  expenses: string;
  settings: string;
}

export function tripWorkspaceNavItems(tripId: string, labels: TripWorkspaceNavLabels): TripWorkspaceNavItem[] {
  return [
    { id: "overview", label: labels.overview, icon: "home", href: appRoutes.tripOverview(tripId) },
    { id: "itinerary", label: labels.itinerary, icon: "calendar", href: appRoutes.tripItinerary(tripId) },
    { id: "map", label: labels.map, icon: "map", href: appRoutes.tripMap(tripId) },
    { id: "timeline", label: labels.timeline, icon: "list", href: appRoutes.tripTimeline(tripId) },
    { id: "bookings", label: labels.bookings, icon: "ticket", href: appRoutes.tripBookings(tripId) },
    { id: "photos", label: labels.photos, icon: "cloud", href: appRoutes.tripPhotos(tripId) },
    { id: "members", label: labels.members, icon: "users", href: appRoutes.tripMembers(tripId) },
    { id: "expenses", label: labels.expenses, icon: "wallet", href: appRoutes.tripExpenses(tripId) },
  ];
}
