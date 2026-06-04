import type { PlanningView } from "@/src/app/SagittariusApp";

function segment(value: string): string {
  return encodeURIComponent(value);
}

export const appRoutes = {
  home: () => "/",
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
    return returnTo ? `${base}?returnTo=${encodeURIComponent(returnTo)}` : base;
  },
  tripOverview: (tripId: string) => `/trips/${segment(tripId)}`,
  tripItinerary: (tripId: string) => `/trips/${segment(tripId)}/itinerary`,
  tripMap: (tripId: string) => `/trips/${segment(tripId)}/map`,
  tripTimeline: (tripId: string) => `/trips/${segment(tripId)}/timeline`,
  tripMembers: (tripId: string) => `/trips/${segment(tripId)}/members`,
};

interface TripWorkspaceNavItem {
  id: PlanningView;
  label: string;
  icon: "home" | "calendar" | "map" | "list" | "users";
  href: string;
}

export interface TripWorkspaceNavLabels {
  overview: string;
  itinerary: string;
  map: string;
  timeline: string;
  members: string;
}

export function tripWorkspaceNavItems(tripId: string, labels: TripWorkspaceNavLabels): TripWorkspaceNavItem[] {
  return [
    { id: "overview", label: labels.overview, icon: "home", href: appRoutes.tripOverview(tripId) },
    { id: "itinerary", label: labels.itinerary, icon: "calendar", href: appRoutes.tripItinerary(tripId) },
    { id: "map", label: labels.map, icon: "map", href: appRoutes.tripMap(tripId) },
    { id: "timeline", label: labels.timeline, icon: "list", href: appRoutes.tripTimeline(tripId) },
    { id: "members", label: labels.members, icon: "users", href: appRoutes.tripMembers(tripId) },
  ];
}
