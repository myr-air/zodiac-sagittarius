import { appRoutes } from "@/src/routes/app-routes";

export const portalRoutes = {
  base: appRoutes.portal(),
  trips: appRoutes.portal(),
  myTrips: appRoutes.portalMyTrips(),
  explorer: appRoutes.portalExplorer(),
  toDos: appRoutes.portalToDos(),
  vault: appRoutes.portalVault(),
  settings: appRoutes.portalSettings(),
  signOut: appRoutes.portalSignOut(),
  newTrip: appRoutes.portalNewTrip(),
} as const;

export const tripRoutes = {
  base: (tripId: string) => appRoutes.tripOverview(tripId),
  tripsBase: appRoutes.trips(),
  tripsNew: appRoutes.newTrip(),
  itinerary: (tripId: string) => appRoutes.tripItinerary(tripId),
  map: (tripId: string) => appRoutes.tripMap(tripId),
  timeline: (tripId: string) => appRoutes.tripTimeline(tripId),
  members: (tripId: string) => appRoutes.tripMembers(tripId),
  bookings: (tripId: string) => appRoutes.tripBookings(tripId),
  expenses: (tripId: string) => appRoutes.tripExpenses(tripId),
  photos: (tripId: string) => appRoutes.tripPhotos(tripId),
  settings: (tripId: string) => appRoutes.tripSettings(tripId),
  overview: (tripId: string) => appRoutes.tripOverview(tripId),
} as const;
