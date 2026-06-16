import { appRoutes } from "@/src/routes/app-routes";
import { decodeTripId } from "@/src/trip/ids";

export function resolveJoinPostAuthReturnTo(
  returnTo: string | null,
  tripId: string,
): string | null {
  if (!returnTo || !returnTo.startsWith("/")) return null;
  if (returnTo === appRoutes.trips()) return null;

  if (returnTo.startsWith("/trips/")) {
    const tripSegment = returnTo.slice("/trips/".length).split(/[/?#]/, 1)[0];
    const normalizedTripSegment = decodeTripId(tripSegment);
    if (normalizedTripSegment !== tripId) return null;
  }

  return returnTo;
}
