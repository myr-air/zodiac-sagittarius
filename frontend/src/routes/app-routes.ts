import { encodeTripId } from "@/src/trip/identity";
import type { PlanningView } from "@/src/trip/workspace/planning-view";
import type { Phase } from "@/src/trip/workspace/phase";

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
  tripDreamer: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/dreamer`,
  tripFlexibleHunter: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/flexible-hunter`,
  tripBudget: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/budget`,
  tripRouteBuilder: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/route-builder`,
  tripDetailPlanner: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/detail-planner`,
  tripGroupWrangler: (tripId: string) => `/trips/${tripRouteSegment(tripId)}/group-wrangler`,
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
  budget: string;
}

export function tripWorkspaceNavItems(tripId: string, labels: TripWorkspaceNavLabels, phase?: Phase): TripWorkspaceNavItem[] {
  const allItems: TripWorkspaceNavItem[] = [
    { id: "overview", label: labels.overview, icon: "home", href: appRoutes.tripOverview(tripId) },
    { id: "itinerary", label: labels.itinerary, icon: "calendar", href: appRoutes.tripItinerary(tripId) },
    { id: "map", label: labels.map, icon: "map", href: appRoutes.tripMap(tripId) },
    { id: "timeline", label: labels.timeline, icon: "list", href: appRoutes.tripTimeline(tripId) },
    { id: "bookings", label: labels.bookings, icon: "ticket", href: appRoutes.tripBookings(tripId) },
    { id: "photos", label: labels.photos, icon: "cloud", href: appRoutes.tripPhotos(tripId) },
    { id: "members", label: labels.members, icon: "users", href: appRoutes.tripMembers(tripId) },
    { id: "expenses", label: labels.expenses, icon: "wallet", href: appRoutes.tripExpenses(tripId) },
    { id: "budget", label: labels.budget, icon: "wallet", href: appRoutes.tripBudget(tripId) },
  ];

  if (phase === undefined) {
    return allItems;
  }

  const phaseViewIds = PHASE_NAV_ITEMS[phase];
  return allItems.filter((item) => phaseViewIds.has(item.id));
}

/** PlanningView ids shown in the left rail for each journey phase. */
const PHASE_NAV_ITEMS: Record<Phase, Set<PlanningView>> = {
  dreamer: new Set<PlanningView>(["overview", "photos"]),
  "flexible-hunter": new Set<PlanningView>(["overview", "budget"]),
  "route-builder": new Set<PlanningView>(["map", "itinerary"]),
  "detail-planner": new Set<PlanningView>(["itinerary", "map", "timeline", "bookings"]),
  "group-wrangler": new Set<PlanningView>(["members", "expenses"]),
  "on-trip-companion": new Set<PlanningView>(),
};
