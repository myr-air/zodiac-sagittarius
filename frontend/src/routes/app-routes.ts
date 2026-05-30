import type { PlanningView } from "@/src/app/SagittariusApp";

function segment(value: string): string {
  return encodeURIComponent(value);
}

export const appRoutes = {
  home: () => "/",
  login: () => "/login",
  account: () => "/account",
  trips: () => "/trips",
  newTrip: () => "/trips/new",
  join: (joinCode: string) => `/join/${segment(joinCode)}`,
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

export function tripWorkspaceNavItems(tripId: string): TripWorkspaceNavItem[] {
  return [
    { id: "overview", label: "ภาพรวม", icon: "home", href: appRoutes.tripOverview(tripId) },
    { id: "itinerary", label: "แผนการเดินทาง", icon: "calendar", href: appRoutes.tripItinerary(tripId) },
    { id: "map", label: "แผนที่", icon: "map", href: appRoutes.tripMap(tripId) },
    { id: "timeline", label: "ไทม์ไลน์", icon: "list", href: appRoutes.tripTimeline(tripId) },
    { id: "members", label: "สมาชิก", icon: "users", href: appRoutes.tripMembers(tripId) },
  ];
}
