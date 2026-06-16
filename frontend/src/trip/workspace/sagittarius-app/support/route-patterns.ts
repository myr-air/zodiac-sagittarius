export const portalRoutes = {
  base: "/portal",
  trips: "/portal/trips",
  myTrips: "/portal/my-trips",
  explorer: "/portal/explorer",
  toDos: "/portal/to-dos",
  vault: "/portal/vault",
  settings: "/portal/settings",
  signOut: "/portal/sign-out",
  newTrip: "/portal/trips/new",
} as const;

export const tripRoutes = {
  base: (tripId: string) => `/trips/${tripId}`,
  tripsBase: "/trips",
  tripsNew: "/trips/new",
  itinerary: (tripId: string) => `/trips/${tripId}/itinerary`,
  map: (tripId: string) => `/trips/${tripId}/map`,
  timeline: (tripId: string) => `/trips/${tripId}/timeline`,
  members: (tripId: string) => `/trips/${tripId}/members`,
  bookings: (tripId: string) => `/trips/${tripId}/bookings`,
  expenses: (tripId: string) => `/trips/${tripId}/expenses`,
  photos: (tripId: string) => `/trips/${tripId}/photos`,
  settings: (tripId: string) => `/trips/${tripId}/settings`,
  overview: (tripId: string) => `/trips/${tripId}`,
} as const;
